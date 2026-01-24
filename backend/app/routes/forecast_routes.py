"""
Forecast Routes
API endpoints for demand forecasting
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from app import db
from app.models.sales_models import SalesRecord, ForecastResult
from app.services.demand_forecasting_service import get_forecast_service

forecast_bp = Blueprint('forecast', __name__)


@forecast_bp.route('/train', methods=['POST'])
@jwt_required()
def train_forecast_model():
    """Train demand forecasting model from sales data"""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    # Get model type
    model_type = data.get('model_type', 'random_forest')
    days = int(data.get('days', 90))  # Last N days of data
    
    # Get sales data
    start_date = datetime.utcnow().date() - timedelta(days=days)
    sales = SalesRecord.query.filter(
        SalesRecord.user_id == user_id,
        SalesRecord.sale_date >= start_date
    ).all()
    
    if not sales:
        return jsonify({'error': 'No sales data found. Please import sales data first.'}), 400
    
    sales_data = [s.to_dict() for s in sales]
    
    # Train model
    service = get_forecast_service()
    result = service.train_forecast_model(sales_data, user_id, model_type)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify({
        'message': 'Model trained successfully',
        **result
    }), 200


@forecast_bp.route('/predict/<product_name>', methods=['GET'])
@jwt_required()
def predict_demand(product_name):
    """Get demand prediction for a specific product"""
    user_id = int(get_jwt_identity())
    days = int(request.args.get('days', 7))
    
    # Get recent sales for lag features
    start_date = datetime.utcnow().date() - timedelta(days=14)
    recent_sales = SalesRecord.query.filter(
        SalesRecord.user_id == user_id,
        SalesRecord.product_name == product_name,
        SalesRecord.sale_date >= start_date
    ).all()
    
    recent_data = [s.to_dict() for s in recent_sales]
    
    # Get prediction
    service = get_forecast_service()
    result = service.predict_demand(product_name, user_id, days, recent_data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    # Save predictions for accuracy tracking
    for pred in result['predictions']:
        forecast = ForecastResult(
            user_id=user_id,
            model_type='random_forest',
            forecast_date=datetime.utcnow().date(),
            target_date=datetime.fromisoformat(pred['date']).date(),
            product_name=product_name,
            predicted_quantity=pred['predicted_quantity'],
            confidence_lower=pred['confidence_lower'],
            confidence_upper=pred['confidence_upper']
        )
        db.session.add(forecast)
    
    db.session.commit()
    
    return jsonify(result), 200


@forecast_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_forecasts():
    """Get forecasts for all products with trained models"""
    user_id = int(get_jwt_identity())
    days = int(request.args.get('days', 7))
    
    # Get unique products from sales
    products = db.session.query(SalesRecord.product_name).filter_by(
        user_id=user_id
    ).distinct().all()
    
    product_names = [p[0] for p in products]
    
    if not product_names:
        return jsonify({
            'error': 'No products found in sales data',
            'forecasts': []
        }), 200
    
    # Get recent sales by product
    start_date = datetime.utcnow().date() - timedelta(days=14)
    recent_sales = SalesRecord.query.filter(
        SalesRecord.user_id == user_id,
        SalesRecord.sale_date >= start_date
    ).all()
    
    recent_by_product = {}
    for sale in recent_sales:
        if sale.product_name not in recent_by_product:
            recent_by_product[sale.product_name] = []
        recent_by_product[sale.product_name].append(sale.to_dict())
    
    # Get forecasts
    service = get_forecast_service()
    result = service.get_all_forecasts(user_id, product_names, days, recent_by_product)
    
    return jsonify(result), 200


@forecast_bp.route('/accuracy', methods=['GET'])
@jwt_required()
def get_accuracy_metrics():
    """Get model accuracy metrics"""
    user_id = int(get_jwt_identity())
    days = int(request.args.get('days', 30))
    
    # Get forecasts with actual values
    start_date = datetime.utcnow().date() - timedelta(days=days)
    forecasts = ForecastResult.query.filter(
        ForecastResult.user_id == user_id,
        ForecastResult.target_date >= start_date,
        ForecastResult.target_date <= datetime.utcnow().date()
    ).all()
    
    # Calculate actuals from sales
    for forecast in forecasts:
        if forecast.actual_quantity is None:
            # Get actual sales for that date and product
            actual_sales = SalesRecord.query.filter(
                SalesRecord.user_id == user_id,
                SalesRecord.product_name == forecast.product_name,
                SalesRecord.sale_date == forecast.target_date
            ).all()
            
            actual_qty = sum(s.quantity_sold for s in actual_sales)
            forecast.actual_quantity = actual_qty
            forecast.error = actual_qty - forecast.predicted_quantity
            if actual_qty > 0:
                forecast.error_percent = abs(forecast.error) / actual_qty * 100
    
    db.session.commit()
    
    # Calculate metrics
    forecast_data = [f.to_dict() for f in forecasts if f.actual_quantity is not None]
    
    if not forecast_data:
        return jsonify({
            'message': 'No completed forecasts to evaluate yet',
            'total_forecasts': len(forecasts),
            'evaluated': 0
        }), 200
    
    service = get_forecast_service()
    metrics = service.get_accuracy_metrics(user_id, forecast_data)
    
    return jsonify({
        'total_forecasts': len(forecasts),
        'evaluated': len(forecast_data),
        **metrics
    }), 200


@forecast_bp.route('/weekly-order', methods=['GET'])
@jwt_required()
def get_weekly_order_suggestion():
    """Generate weekly order suggestions based on forecasts"""
    user_id = int(get_jwt_identity())
    
    # Get 7-day forecasts for all products
    service = get_forecast_service()
    
    # Get products
    products = db.session.query(SalesRecord.product_name).filter_by(
        user_id=user_id
    ).distinct().all()
    product_names = [p[0] for p in products]
    
    if not product_names:
        return jsonify({'error': 'No products found'}), 400
    
    # Get current inventory
    from app.models.inventory_models import InventoryItem
    inventory = InventoryItem.query.filter_by(user_id=user_id).all()
    inventory_map = {item.name: item.quantity for item in inventory}
    
    # Get forecasts
    forecasts = service.get_all_forecasts(user_id, product_names, 7, {})
    
    # Generate order suggestions
    suggestions = []
    total_order_value = 0
    
    for forecast in forecasts.get('forecasts', []):
        product = forecast['product_name']
        total_predicted = forecast['total_predicted']
        current_stock = inventory_map.get(product, 0)
        
        # Calculate needed quantity (predicted - current + safety buffer)
        safety_buffer = total_predicted * 0.2  # 20% safety stock
        needed = total_predicted + safety_buffer - current_stock
        
        if needed > 0:
            # Get average price from sales
            avg_sale = SalesRecord.query.filter_by(
                user_id=user_id,
                product_name=product
            ).first()
            
            cost_estimate = needed * (avg_sale.unit_price * 0.7 if avg_sale else 10)
            
            suggestions.append({
                'product_name': product,
                'current_stock': current_stock,
                'predicted_demand': round(total_predicted, 1),
                'safety_buffer': round(safety_buffer, 1),
                'order_quantity': round(needed, 0),
                'cost_estimate': round(cost_estimate, 2),
                'urgency': 'critical' if current_stock == 0 else 'high' if needed > total_predicted else 'normal'
            })
            total_order_value += cost_estimate
    
    # Sort by urgency
    urgency_order = {'critical': 0, 'high': 1, 'normal': 2}
    suggestions.sort(key=lambda x: urgency_order.get(x['urgency'], 3))
    
    return jsonify({
        'week_start': datetime.utcnow().date().isoformat(),
        'week_end': (datetime.utcnow().date() + timedelta(days=7)).isoformat(),
        'total_products': len(suggestions),
        'total_order_value': round(total_order_value, 2),
        'critical_items': len([s for s in suggestions if s['urgency'] == 'critical']),
        'suggestions': suggestions
    }), 200
