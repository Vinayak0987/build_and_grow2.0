"""
AI Reasoning Routes
AI-powered dataset analysis with intelligent insights
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.dataset import Dataset
import os
import json
import io
import pandas as pd

reasoning_bp = Blueprint('reasoning', __name__)


@reasoning_bp.route('/analyze/<int:dataset_id>', methods=['POST'])
@jwt_required()
def analyze_dataset(dataset_id):
    """
    Comprehensive AI analysis of a dataset
    Provides stock-like analysis, insights, and recommendations
    """
    user_id = int(get_jwt_identity())
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        from app.services.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
        
        # Run all analysis functions
        data_analysis = analyze_data_quality(df)
        column_analysis = analyze_columns(df)
        statistical_analysis = analyze_statistics(df)
        recommendations = generate_recommendations(df, data_analysis)
        
        # Generate AI insights using Gemini
        ai_insights = generate_ai_insights(df, data_analysis, column_analysis)
        
        return jsonify({
            'success': True,
            'dataset_name': dataset.name,
            'data_analysis': data_analysis,
            'column_analysis': column_analysis,
            'statistical_analysis': statistical_analysis,
            'recommendations': recommendations,
            'ai_insights': ai_insights
        }), 200
        
    except Exception as e:
        print(f"Dataset analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@reasoning_bp.route('/stock-analysis/<int:dataset_id>', methods=['POST'])
@jwt_required()
def stock_analysis(dataset_id):
    """
    Treat dataset as inventory/stock data and analyze it
    Automatically detects quantity, product, and category columns
    """
    user_id = int(get_jwt_identity())
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        from app.services.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
        
        # Detect column mappings
        column_mapping = detect_column_mapping(df)
        
        # Generate stock analysis
        analysis = generate_stock_analysis(df, column_mapping)
        
        return jsonify(analysis), 200
        
    except Exception as e:
        print(f"Stock analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@reasoning_bp.route('/expiry-analysis/<int:dataset_id>', methods=['POST'])
@jwt_required()
def expiry_analysis(dataset_id):
    """
    Analyze date-based data for trends and expiry-like patterns
    """
    user_id = int(get_jwt_identity())
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        from app.services.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
        
        # Find date columns and analyze
        analysis = analyze_date_patterns(df)
        
        return jsonify(analysis), 200
        
    except Exception as e:
        print(f"Expiry analysis error: {e}")
        return jsonify({'error': str(e)}), 500


@reasoning_bp.route('/order-suggestions/<int:dataset_id>', methods=['POST'])
@jwt_required()
def order_suggestions(dataset_id):
    """
    Generate intelligent order/action suggestions based on dataset analysis
    """
    user_id = int(get_jwt_identity())
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        from app.services.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
        
        # Detect column types and generate suggestions
        column_mapping = detect_column_mapping(df)
        suggestions = generate_action_suggestions(df, column_mapping)
        
        return jsonify(suggestions), 200
        
    except Exception as e:
        print(f"Order suggestions error: {e}")
        return jsonify({'error': str(e)}), 500


@reasoning_bp.route('/trends/<int:dataset_id>', methods=['POST'])
@jwt_required()
def trends_analysis(dataset_id):
    """
    Analyze trends and patterns in the dataset
    """
    user_id = int(get_jwt_identity())
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    try:
        from app.services.minio_service import get_minio_service
        
        minio_service = get_minio_service()
        file_content = minio_service.download_bytes('datasets', dataset.file_path)
        
        if dataset.file_type == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            df = pd.read_excel(io.BytesIO(file_content))
        
        # Analyze trends
        analysis = analyze_trends_patterns(df)
        
        return jsonify(analysis), 200
        
    except Exception as e:
        print(f"Trends analysis error: {e}")
        return jsonify({'error': str(e)}), 500


@reasoning_bp.route('/full-report/<int:dataset_id>', methods=['POST'])
@jwt_required()
def full_report(dataset_id):
    """
    Generate comprehensive AI-powered report for a dataset
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    dataset = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first()
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404
    
    stock_analysis = data.get('stock_analysis', {})
    expiry_analysis = data.get('expiry_analysis', {})
    order_suggestions = data.get('order_suggestions', {})
    trends_analysis = data.get('trends_analysis', {})
    
    try:
        import google.generativeai as genai
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                'summary': f"Analysis of {dataset.name}: {stock_analysis.get('total_items', 0)} records analyzed with {stock_analysis.get('health_score', 0):.1f}% health score.",
                'recommendations': generate_basic_recommendations(stock_analysis, order_suggestions)
            }), 200
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""You are an AI data analyst. Generate a comprehensive report based on the following analysis:

DATASET: {dataset.name}

DATA ANALYSIS:
- Total Records: {stock_analysis.get('total_items', 0)}
- Health Score: {stock_analysis.get('health_score', 0):.1f}%
- Issues Found: {stock_analysis.get('low_stock', {}).get('count', 0) + stock_analysis.get('out_of_stock', {}).get('count', 0)}

KEY METRICS:
- Critical Items: {order_suggestions.get('critical_count', 0)}
- High Priority: {order_suggestions.get('high_priority_count', 0)}
- Total Suggestions: {order_suggestions.get('total_items', 0)}

TRENDS:
- Pattern Count: {trends_analysis.get('pattern_count', 0)}
- Correlation Insights: {len(trends_analysis.get('correlations', []))}

Please provide:
1. Executive summary (2-3 sentences)
2. 5 actionable recommendations
3. Risk assessment

Format as JSON:
{{
    "summary": "...",
    "recommendations": ["...", "..."],
    "risk_level": "low/medium/high",
    "risk_reason": "...",
    "insights": ["...", "..."]
}}
"""
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            report = json.loads(json_match.group())
        else:
            report = {
                'summary': text[:500],
                'recommendations': generate_basic_recommendations(stock_analysis, order_suggestions)
            }
        
        return jsonify(report), 200
        
    except Exception as e:
        print(f"Report generation error: {e}")
        return jsonify({
            'summary': f"Analysis of {dataset.name} completed successfully.",
            'recommendations': generate_basic_recommendations(stock_analysis, order_suggestions)
        }), 200


# ============ Helper Functions ============

def analyze_data_quality(df):
    """Analyze data quality metrics"""
    total_cells = df.size
    missing_cells = df.isnull().sum().sum()
    
    # Check for duplicates
    duplicate_rows = df.duplicated().sum()
    
    # Calculate quality score
    completeness = (1 - missing_cells / total_cells) * 100 if total_cells > 0 else 0
    uniqueness = (1 - duplicate_rows / len(df)) * 100 if len(df) > 0 else 0
    
    quality_score = (completeness + uniqueness) / 2
    
    return {
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'total_cells': total_cells,
        'missing_cells': int(missing_cells),
        'completeness': round(completeness, 1),
        'duplicate_rows': int(duplicate_rows),
        'uniqueness': round(uniqueness, 1),
        'quality_score': round(quality_score, 1)
    }


def analyze_columns(df):
    """Analyze each column in the dataset"""
    columns = []
    
    for col in df.columns:
        col_info = {
            'name': col,
            'dtype': str(df[col].dtype),
            'null_count': int(df[col].isnull().sum()),
            'null_percentage': round(df[col].isnull().sum() / len(df) * 100, 1) if len(df) > 0 else 0,
            'unique_count': int(df[col].nunique())
        }
        
        if df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
            col_info['min'] = float(df[col].min()) if not pd.isna(df[col].min()) else None
            col_info['max'] = float(df[col].max()) if not pd.isna(df[col].max()) else None
            col_info['mean'] = round(float(df[col].mean()), 2) if not pd.isna(df[col].mean()) else None
            col_info['median'] = round(float(df[col].median()), 2) if not pd.isna(df[col].median()) else None
            col_info['std'] = round(float(df[col].std()), 2) if not pd.isna(df[col].std()) else None
            col_info['is_numeric'] = True
        else:
            # Top values for categorical
            if df[col].nunique() <= 20:
                top_values = df[col].value_counts().head(5).to_dict()
                col_info['top_values'] = {str(k): int(v) for k, v in top_values.items()}
            col_info['is_numeric'] = False
        
        columns.append(col_info)
    
    return columns


def analyze_statistics(df):
    """Generate statistical analysis"""
    numeric_cols = df.select_dtypes(include=['number']).columns
    
    stats = {
        'numeric_columns': len(numeric_cols),
        'categorical_columns': len(df.columns) - len(numeric_cols),
        'correlations': []
    }
    
    # Find strong correlations
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr()
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.5 and not pd.isna(corr_val):
                    stats['correlations'].append({
                        'col1': numeric_cols[i],
                        'col2': numeric_cols[j],
                        'value': round(corr_val, 3)
                    })
    
    # Add distribution info for numeric columns
    stats['distributions'] = []
    for col in list(numeric_cols)[:5]:  # Top 5 numeric columns
        col_stats = df[col].describe()
        stats['distributions'].append({
            'column': col,
            'min': float(col_stats['min']) if not pd.isna(col_stats['min']) else 0,
            'max': float(col_stats['max']) if not pd.isna(col_stats['max']) else 0,
            'mean': float(col_stats['mean']) if not pd.isna(col_stats['mean']) else 0,
            'std': float(col_stats['std']) if not pd.isna(col_stats['std']) else 0
        })
    
    return stats


def generate_recommendations(df, quality_analysis):
    """Generate data recommendations"""
    recommendations = []
    
    if quality_analysis['missing_cells'] > 0:
        recommendations.append({
            'type': 'data_quality',
            'priority': 'high' if quality_analysis['completeness'] < 90 else 'medium',
            'title': 'Handle Missing Data',
            'description': f"Found {quality_analysis['missing_cells']} missing values ({100 - quality_analysis['completeness']:.1f}%). Consider imputation or removal strategies."
        })
    
    if quality_analysis['duplicate_rows'] > 0:
        recommendations.append({
            'type': 'data_quality',
            'priority': 'medium',
            'title': 'Remove Duplicates',
            'description': f"Found {quality_analysis['duplicate_rows']} duplicate rows. Review and remove if not intentional."
        })
    
    if quality_analysis['total_rows'] < 100:
        recommendations.append({
            'type': 'data_quantity',
            'priority': 'low',
            'title': 'Increase Data Volume',
            'description': 'Dataset is small. Consider collecting more data for better analysis and model training.'
        })
    
    # Check for high cardinality columns
    for col in df.columns:
        if df[col].dtype == 'object' and df[col].nunique() > 50:
            recommendations.append({
                'type': 'feature_engineering',
                'priority': 'low',
                'title': f'High Cardinality: {col}',
                'description': f'Column "{col}" has {df[col].nunique()} unique values. Consider encoding or grouping.'
            })
    
    return recommendations


def generate_ai_insights(df, data_analysis, column_analysis):
    """Generate AI-powered insights"""
    try:
        import google.generativeai as genai
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return generate_basic_insights(data_analysis, column_analysis)
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Build prompt
        columns_str = "\n".join([f"- {c['name']}: {c['dtype']} ({c['null_count']} nulls, {c['unique_count']} unique)" for c in column_analysis[:10]])
        
        prompt = f"""Analyze this dataset and provide key insights:

DATASET OVERVIEW:
- Rows: {data_analysis['total_rows']}
- Columns: {data_analysis['total_columns']}
- Quality Score: {data_analysis['quality_score']}%

COLUMNS:
{columns_str}

SAMPLE DATA (first row):
{df.head(1).to_dict('records')[0] if len(df) > 0 else 'No data'}

Provide 3-5 key insights about this data in simple, actionable language. Return as JSON array:
["insight 1", "insight 2", ...]
"""
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON array
        import re
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        return generate_basic_insights(data_analysis, column_analysis)
        
    except Exception as e:
        print(f"AI insights error: {e}")
        return generate_basic_insights(data_analysis, column_analysis)


def generate_basic_insights(data_analysis, column_analysis):
    """Generate basic insights without AI"""
    insights = []
    
    insights.append(f"Dataset contains {data_analysis['total_rows']} records across {data_analysis['total_columns']} columns")
    
    if data_analysis['quality_score'] >= 90:
        insights.append("Data quality is excellent with minimal missing values")
    elif data_analysis['quality_score'] >= 70:
        insights.append("Data quality is good but some cleaning may improve analysis")
    else:
        insights.append("Data requires significant cleaning before analysis")
    
    numeric_cols = [c for c in column_analysis if c.get('is_numeric')]
    if numeric_cols:
        insights.append(f"Found {len(numeric_cols)} numeric columns suitable for statistical analysis")
    
    return insights


def detect_column_mapping(df):
    """Detect common column types in dataset"""
    mapping = {
        'quantity': None,
        'name': None,
        'category': None,
        'price': None,
        'date': None,
        'id': None
    }
    
    col_lower = {col: col.lower() for col in df.columns}
    
    # Detect quantity columns
    qty_keywords = ['quantity', 'qty', 'stock', 'count', 'units', 'amount']
    for col, lower in col_lower.items():
        for kw in qty_keywords:
            if kw in lower and df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
                mapping['quantity'] = col
                break
    
    # Detect name columns
    name_keywords = ['name', 'product', 'item', 'title', 'description']
    for col, lower in col_lower.items():
        for kw in name_keywords:
            if kw in lower:
                mapping['name'] = col
                break
    
    # Detect category
    cat_keywords = ['category', 'type', 'group', 'class']
    for col, lower in col_lower.items():
        for kw in cat_keywords:
            if kw in lower:
                mapping['category'] = col
                break
    
    # Detect price
    price_keywords = ['price', 'cost', 'amount', 'value', 'revenue']
    for col, lower in col_lower.items():
        for kw in price_keywords:
            if kw in lower and df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
                mapping['price'] = col
                break
    
    # Detect date
    date_keywords = ['date', 'time', 'created', 'updated', 'expiry']
    for col, lower in col_lower.items():
        for kw in date_keywords:
            if kw in lower:
                mapping['date'] = col
                break
    
    return mapping


def generate_stock_analysis(df, column_mapping):
    """Generate stock-like analysis from dataset"""
    qty_col = column_mapping.get('quantity')
    name_col = column_mapping.get('name')
    cat_col = column_mapping.get('category')
    
    analysis = {
        'total_items': len(df),
        'health_score': 100.0,
        'out_of_stock': {'count': 0, 'items': []},
        'low_stock': {'count': 0, 'items': []},
        'overstocked': {'count': 0, 'items': []},
        'healthy': {'count': len(df)},
        'ai_insights': ''
    }
    
    if qty_col:
        # Calculate thresholds based on data distribution
        qty_mean = df[qty_col].mean()
        qty_std = df[qty_col].std()
        
        low_threshold = max(0, qty_mean - qty_std)
        high_threshold = qty_mean + 2 * qty_std
        
        out_of_stock = df[df[qty_col] == 0]
        low_stock = df[(df[qty_col] > 0) & (df[qty_col] <= low_threshold)]
        overstocked = df[df[qty_col] > high_threshold]
        healthy = df[(df[qty_col] > low_threshold) & (df[qty_col] <= high_threshold)]
        
        # Build items lists
        out_items = []
        for _, row in out_of_stock.head(10).iterrows():
            item = {'quantity': 0, 'min_stock_level': int(low_threshold)}
            if name_col:
                item['name'] = str(row[name_col])
            if cat_col:
                item['category'] = str(row[cat_col])
            out_items.append(item)
        
        low_items = []
        for _, row in low_stock.head(10).iterrows():
            item = {'quantity': int(row[qty_col]), 'min_stock_level': int(low_threshold)}
            if name_col:
                item['name'] = str(row[name_col])
            if cat_col:
                item['category'] = str(row[cat_col])
            low_items.append(item)
        
        analysis['out_of_stock'] = {'count': len(out_of_stock), 'items': out_items}
        analysis['low_stock'] = {'count': len(low_stock), 'items': low_items}
        analysis['overstocked'] = {'count': len(overstocked), 'items': []}
        analysis['healthy'] = {'count': len(healthy)}
        
        # Calculate health score
        total = len(df)
        if total > 0:
            analysis['health_score'] = round((len(healthy) / total) * 100, 1)
    
    # Generate AI insights
    try:
        import google.generativeai as genai
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""Based on this inventory analysis, provide a brief insight (2-3 sentences):
- Total Items: {analysis['total_items']}
- Health Score: {analysis['health_score']}%
- Out of Stock: {analysis['out_of_stock']['count']}
- Low Stock: {analysis['low_stock']['count']}

Return only the insight text, no formatting."""
            
            response = model.generate_content(prompt)
            analysis['ai_insights'] = response.text.strip()
    except:
        analysis['ai_insights'] = f"Analysis complete: {analysis['healthy']['count']} items are healthy. {analysis['low_stock']['count']} items need attention."
    
    return analysis


def analyze_date_patterns(df):
    """Analyze date-based patterns"""
    analysis = {
        'expired': {'count': 0, 'items': []},
        'expiring_soon': {'count': 0, 'items': []},
        'selling_tips': []
    }
    
    # Find date columns
    date_cols = []
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower() or 'expiry' in col.lower():
            date_cols.append(col)
    
    if not date_cols:
        # Try to detect date columns by content
        for col in df.columns:
            try:
                pd.to_datetime(df[col].head(10), errors='raise')
                date_cols.append(col)
            except:
                pass
    
    if date_cols:
        date_col = date_cols[0]
        try:
            df_dates = df.copy()
            df_dates[date_col] = pd.to_datetime(df_dates[date_col], errors='coerce')
            now = pd.Timestamp.now()
            
            # Find past/expired dates
            expired = df_dates[df_dates[date_col] < now]
            expiring = df_dates[(df_dates[date_col] >= now) & (df_dates[date_col] <= now + pd.Timedelta(days=7))]
            
            analysis['expired']['count'] = len(expired)
            analysis['expiring_soon']['count'] = len(expiring)
            
            # Add sample items
            for _, row in expired.head(5).iterrows():
                analysis['expired']['items'].append({
                    'name': str(row.iloc[0]),
                    'days_until_expiry': (row[date_col] - now).days
                })
            
            for _, row in expiring.head(5).iterrows():
                analysis['expiring_soon']['items'].append({
                    'name': str(row.iloc[0]),
                    'days_until_expiry': (row[date_col] - now).days,
                    'quantity': 1
                })
        except Exception as e:
            print(f"Date analysis error: {e}")
    
    return analysis


def generate_action_suggestions(df, column_mapping):
    """Generate action suggestions based on data"""
    suggestions = {
        'suggested_items': [],
        'total_items': 0,
        'critical_count': 0,
        'high_priority_count': 0,
        'estimated_total_cost': 0,
        'ai_reasoning': ''
    }
    
    qty_col = column_mapping.get('quantity')
    name_col = column_mapping.get('name')
    price_col = column_mapping.get('price')
    
    if qty_col:
        # Find items needing attention
        qty_mean = df[qty_col].mean()
        low_threshold = max(0, qty_mean * 0.5)
        
        low_items = df[df[qty_col] <= low_threshold]
        
        for _, row in low_items.head(15).iterrows():
            qty = int(row[qty_col])
            order_qty = int(qty_mean * 2) - qty
            
            if qty == 0:
                urgency = 'critical'
            elif qty <= low_threshold * 0.5:
                urgency = 'high'
            else:
                urgency = 'normal'
            
            item = {
                'item_name': str(row[name_col]) if name_col else f"Item {_}",
                'current_quantity': qty,
                'order_quantity': max(1, order_qty),
                'unit': 'units',
                'urgency': urgency,
                'estimated_cost': order_qty * float(row[price_col]) if price_col else order_qty * 10
            }
            
            suggestions['suggested_items'].append(item)
        
        suggestions['total_items'] = len(suggestions['suggested_items'])
        suggestions['critical_count'] = len([i for i in suggestions['suggested_items'] if i['urgency'] == 'critical'])
        suggestions['high_priority_count'] = len([i for i in suggestions['suggested_items'] if i['urgency'] == 'high'])
        suggestions['estimated_total_cost'] = sum(i['estimated_cost'] for i in suggestions['suggested_items'])
    
    # Generate AI reasoning
    try:
        import google.generativeai as genai
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""Provide a brief reasoning (2-3 sentences) for these data-driven recommendations:
- Total Suggestions: {suggestions['total_items']}
- Critical: {suggestions['critical_count']}
- High Priority: {suggestions['high_priority_count']}
- Estimated Cost: ${suggestions['estimated_total_cost']:.0f}

Return only the reasoning text."""
            
            response = model.generate_content(prompt)
            suggestions['ai_reasoning'] = response.text.strip()
    except:
        suggestions['ai_reasoning'] = f"Based on data analysis, {suggestions['total_items']} actions are recommended with {suggestions['critical_count']} being critical priority."
    
    return suggestions


def analyze_trends_patterns(df):
    """Analyze trends and patterns"""
    analysis = {
        'location': 'Data Analysis',
        'date_range_days': 30,
        'events': [],
        'demand_forecast': {
            'top_categories': [],
            'recommendations': []
        },
        'pattern_count': 0,
        'correlations': []
    }
    
    # Find categorical columns for grouping
    cat_cols = df.select_dtypes(include=['object']).columns[:3]
    num_cols = df.select_dtypes(include=['number']).columns[:3]
    
    if len(cat_cols) > 0 and len(num_cols) > 0:
        # Generate "events" from top categories
        for cat_col in cat_cols[:1]:
            value_counts = df[cat_col].value_counts().head(5)
            for val, count in value_counts.items():
                pct = (count / len(df)) * 100
                analysis['events'].append({
                    'name': f"{cat_col}: {val}",
                    'type': 'category_analysis',
                    'impact': 'high' if pct > 20 else 'medium' if pct > 10 else 'low',
                    'expected_demand_change': round(pct, 1),
                    'affected_categories': [str(val)]
                })
        
        analysis['demand_forecast']['top_categories'] = [str(v) for v in value_counts.index[:3]]
    
    # Find correlations
    if len(num_cols) >= 2:
        try:
            corr_matrix = df[num_cols].corr()
            for i in range(len(num_cols)):
                for j in range(i+1, len(num_cols)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.5 and not pd.isna(corr_val):
                        analysis['correlations'].append({
                            'columns': [num_cols[i], num_cols[j]],
                            'value': round(corr_val, 3),
                            'strength': 'strong' if abs(corr_val) > 0.7 else 'moderate'
                        })
        except:
            pass
    
    analysis['pattern_count'] = len(analysis['events']) + len(analysis['correlations'])
    
    # Generate recommendations
    analysis['demand_forecast']['recommendations'] = [
        f"Focus on top categories: {', '.join(analysis['demand_forecast']['top_categories'][:3])}" if analysis['demand_forecast']['top_categories'] else "Analyze category distribution",
        f"Monitor {len(analysis['events'])} key patterns in your data",
        "Use correlation insights for predictive analysis"
    ]
    
    return analysis


def generate_basic_recommendations(stock_analysis, order_suggestions):
    """Generate basic recommendations"""
    return [
        f"Address {order_suggestions.get('critical_count', 0)} critical items immediately",
        f"Review {stock_analysis.get('low_stock', {}).get('count', 0)} low-value items",
        "Improve data quality for better analysis",
        "Consider predictive models for future planning",
        "Monitor trends regularly for proactive decisions"
    ]
