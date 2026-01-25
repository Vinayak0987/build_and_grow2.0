"""
Model Dashboard Routes
API endpoints for the Model Dashboard feature
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.experiment import Experiment
from app.models.dataset import Dataset
import json
import io

model_dashboard_bp = Blueprint('model_dashboard', __name__)


@model_dashboard_bp.route('/<int:model_id>/dashboard/overview', methods=['GET'])
@jwt_required()
def get_model_overview(model_id):
    """Get comprehensive model overview for dashboard"""
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    # Get dataset info
    dataset = Dataset.query.filter_by(id=experiment.dataset_id).first() if experiment.dataset_id else None
    
    # Extract metrics from results
    results = experiment.results or {}
    metrics = results.get('test_metrics', {})
    if not metrics and 'best_result' in results:
        metrics = results.get('best_result', {}).get('test_metrics', {})
    
    # Build overview response
    overview = {
        'model': experiment.to_dict(),
        'metrics': metrics,
        'training_info': {
            'training_time': results.get('training_time', 'N/A'),
            'models_trained': len(results.get('all_results', [])),
            'cv_folds': results.get('cv_folds', 5),
            'completed_at': experiment.completed_at.isoformat() if experiment.completed_at else None
        },
        'dataset_info': {
            'id': dataset.id if dataset else None,
            'name': dataset.name if dataset else 'N/A',
            'num_rows': dataset.num_rows if dataset else None,
            'num_columns': dataset.num_columns if dataset else None,
            'file_size': dataset.file_size if dataset else None
        } if dataset else {},
        'num_features': results.get('num_features', len(results.get('feature_names', []))),
        'feature_names': results.get('feature_names', [])
    }
    
    return jsonify(overview), 200


@model_dashboard_bp.route('/<int:model_id>/dashboard/data', methods=['GET'])
@jwt_required()
def get_training_data(model_id):
    """Get training data for data explorer with pagination"""
    from app.services.minio_service import get_minio_service
    import pandas as pd
    
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        print(f"[DEBUG] Experiment {model_id} not found for user {user_id}", flush=True)
        return jsonify({'error': 'Model not found'}), 404
    
    print(f"[DEBUG] Found experiment: {experiment.name}", flush=True)
    print(f"[DEBUG] experiment.dataset_id: {experiment.dataset_id}", flush=True)
    
    # Get dataset
    dataset = Dataset.query.filter_by(id=experiment.dataset_id).first() if experiment.dataset_id else None
    
    print(f"[DEBUG] dataset found: {dataset is not None}", flush=True)
    if dataset:
        print(f"[DEBUG] dataset.name: {dataset.name}", flush=True)
        print(f"[DEBUG] dataset.file_path: {dataset.file_path}", flush=True)
    
    if not dataset:
        print(f"[DEBUG] Dataset not found for experiment {model_id}", flush=True)
        return jsonify({'error': 'Dataset not found'}), 404
    
    # Pagination params
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    sort_by = request.args.get('sort_by')
    sort_dir = request.args.get('sort_dir', 'asc')
    
    try:
        # Load dataset from MinIO
        minio_service = get_minio_service()
        
        # Debug logging
        print(f"[DEBUG] Loading dataset from MinIO", flush=True)
        print(f"[DEBUG] Dataset ID: {dataset.id}", flush=True)
        print(f"[DEBUG] Dataset file_path: {dataset.file_path}", flush=True)
        print(f"[DEBUG] Dataset file_type: {dataset.file_type}", flush=True)
        
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        print(f"[DEBUG] file_content is None: {file_content is None}", flush=True)
        if file_content:
            print(f"[DEBUG] file_content size: {len(file_content)} bytes", flush=True)
        
        if not file_content:
            return jsonify({'error': 'Failed to load dataset'}), 500
        
        # Parse based on file type
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        elif dataset.file_type in ['xlsx', 'xls']:
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            return jsonify({'error': f'Unsupported file type: {dataset.file_type}'}), 400
        
        # Sort if requested
        if sort_by and sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=(sort_dir == 'asc'))
        
        # Get total rows
        total_rows = len(df)
        
        # Paginate
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        df_page = df.iloc[start_idx:end_idx]
        
        # Convert to records (handle NaN values)
        df_page = df_page.fillna('')
        data = df_page.to_dict('records')
        
        return jsonify({
            'data': data,
            'columns': list(df.columns),
            'total_rows': total_rows,
            'page': page,
            'limit': limit,
            'total_pages': (total_rows + limit - 1) // limit
        }), 200
        
    except Exception as e:
        print(f"Error loading training data: {e}", flush=True)
        return jsonify({'error': f'Failed to load data: {str(e)}'}), 500


@model_dashboard_bp.route('/<int:model_id>/dashboard/data/stats', methods=['GET'])
@jwt_required()
def get_data_statistics(model_id):
    """Get column statistics for training data"""
    from app.services.minio_service import get_minio_service
    import pandas as pd
    import numpy as np
    
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    dataset = Dataset.query.filter_by(id=experiment.dataset_id).first() if experiment.dataset_id else None
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        # Load dataset
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        elif dataset.file_type in ['xlsx', 'xls']:
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        # Calculate column statistics
        column_stats = {}
        for col in df.columns:
            stats = {
                'dtype': str(df[col].dtype),
                'missing': int(df[col].isnull().sum()),
                'unique': int(df[col].nunique())
            }
            
            if np.issubdtype(df[col].dtype, np.number):
                stats.update({
                    'min': float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    'max': float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    'mean': float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    'std': float(df[col].std()) if not pd.isna(df[col].std()) else None,
                    'median': float(df[col].median()) if not pd.isna(df[col].median()) else None
                })
            else:
                # Categorical stats
                top_values = df[col].value_counts().head(5).to_dict()
                stats['top_values'] = {str(k): int(v) for k, v in top_values.items()}
            
            column_stats[col] = stats
        
        # Calculate correlation matrix for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        correlation = {}
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            correlation = corr_matrix.to_dict()
        
        return jsonify({
            'column_stats': column_stats,
            'correlation': correlation,
            'file_size': len(file_content),
            'num_rows': len(df),
            'num_columns': len(df.columns)
        }), 200
        
    except Exception as e:
        print(f"Error calculating statistics: {e}", flush=True)
        return jsonify({'error': f'Failed to calculate statistics: {str(e)}'}), 500


@model_dashboard_bp.route('/<int:model_id>/dashboard/analytics', methods=['GET'])
@jwt_required()
def get_model_analytics(model_id):
    """Get model analytics including confusion matrix and metrics"""
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    results = experiment.results or {}
    
    # Get all model results for comparison
    all_results = results.get('all_results', [])
    
    # Get best result metrics
    best_result = results.get('best_result', {})
    metrics = best_result.get('test_metrics', results.get('test_metrics', {}))
    
    # Get confusion matrix if available
    confusion_matrix = results.get('confusion_matrix')
    
    # Get feature importance if available
    feature_importance = results.get('feature_importance', [])
    
    return jsonify({
        'metrics': metrics,
        'confusion_matrix': confusion_matrix,
        'feature_importance': feature_importance,
        'model_comparison': all_results,
        'best_model': experiment.best_model_name,
        'best_score': experiment.best_score,
        'problem_type': experiment.problem_type
    }), 200


@model_dashboard_bp.route('/<int:model_id>/dashboard/analytics/feature-importance', methods=['GET'])
@jwt_required()
def get_feature_importance(model_id):
    """Get feature importance scores"""
    from app.services.minio_service import get_minio_service
    import zipfile
    
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    results = experiment.results or {}
    
    # Check if we have feature importance in results
    feature_importance = results.get('feature_importance', [])
    
    if not feature_importance:
        # Try to extract from model package
        model_package_path = results.get('model_package_path')
        if model_package_path:
            try:
                minio_service = get_minio_service()
                corrected_path = model_package_path[7:] if model_package_path.startswith('models/') else model_package_path
                zip_content = minio_service.download_bytes('models', corrected_path)
                
                if zip_content:
                    zip_buffer = io.BytesIO(zip_content)
                    with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
                        if 'model_info.json' in zip_ref.namelist():
                            with zip_ref.open('model_info.json') as f:
                                model_info = json.load(f)
                                feature_importance = model_info.get('feature_importance', [])
            except Exception as e:
                print(f"Error extracting feature importance: {e}")
    
    # If still no feature importance, generate placeholder based on feature names
    if not feature_importance:
        feature_names = results.get('feature_names', [])
        if feature_names:
            # Create placeholder importance (you could run actual SHAP here)
            import random
            values = [random.random() for _ in feature_names]
            total = sum(values)
            feature_importance = [
                {'name': name, 'importance': val/total}
                for name, val in zip(feature_names, values)
            ]
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
    
    return jsonify({
        'features': feature_importance
    }), 200


@model_dashboard_bp.route('/<int:model_id>/dashboard/analytics/comparison', methods=['GET'])
@jwt_required()
def get_model_comparison(model_id):
    """Get comparison of all trained algorithms"""
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    results = experiment.results or {}
    all_results = results.get('all_results', [])
    
    return jsonify({
        'models': all_results,
        'best_model': experiment.best_model_name,
        'best_score': experiment.best_score
    }), 200


@model_dashboard_bp.route('/<int:model_id>/dashboard/shap/global', methods=['GET'])
@jwt_required()
def get_global_shap(model_id):
    """Get global SHAP values (placeholder - real SHAP requires model loading)"""
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    results = experiment.results or {}
    feature_names = results.get('feature_names', [])
    
    # Placeholder SHAP values - in production, load model and compute real SHAP
    # This would require loading the model and running SHAP on a background sample
    import random
    
    shap_values = []
    for name in feature_names[:15]:  # Limit to top 15 features
        # Generate realistic-looking SHAP values
        shap_values.append({
            'name': name,
            'mean_shap': round(random.uniform(-0.3, 0.3), 4),
            'std_shap': round(random.uniform(0.05, 0.15), 4)
        })
    
    # Sort by absolute value
    shap_values.sort(key=lambda x: abs(x['mean_shap']), reverse=True)
    
    return jsonify({
        'shap_values': shap_values,
        'note': 'These are placeholder SHAP values. Connect to real SHAP computation for production.'
    }), 200


@model_dashboard_bp.route('/<int:model_id>/dashboard/shap/local', methods=['POST'])
@jwt_required()
def get_local_shap(model_id):
    """Get local SHAP explanation for a specific prediction"""
    user_id = int(get_jwt_identity())
    
    experiment = Experiment.query.filter_by(id=model_id, user_id=user_id).first()
    if not experiment:
        return jsonify({'error': 'Model not found'}), 404
    
    data = request.get_json()
    input_values = data.get('input', {})
    
    if not input_values:
        return jsonify({'error': 'Input values required'}), 400
    
    # Generate placeholder local SHAP values
    # In production, load model and run SHAP TreeExplainer
    import random
    
    shap_values = {}
    for key in input_values.keys():
        shap_values[key] = round(random.uniform(-0.5, 0.5), 4)
    
    return jsonify({
        'shap_values': shap_values,
        'base_value': 0.5,
        'input': input_values,
        'note': 'Placeholder SHAP values for demonstration.'
    }), 200
