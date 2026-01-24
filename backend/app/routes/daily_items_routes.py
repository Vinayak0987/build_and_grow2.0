"""
Daily Items Routes
API endpoints for managing perishable daily items (milk, paneer, etc.)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db
from app.models.sales_models import DailyItem, DailyItemReceipt

daily_items_bp = Blueprint('daily_items', __name__)


@daily_items_bp.route('', methods=['GET'])
@jwt_required()
def get_daily_items():
    """Get all daily item configurations"""
    user_id = int(get_jwt_identity())
    
    items = DailyItem.query.filter_by(user_id=user_id, is_active=True).all()
    
    # Get today's receipts
    today = datetime.utcnow().date()
    
    result = []
    for item in items:
        item_dict = item.to_dict()
        
        # Check if received today
        today_receipt = DailyItemReceipt.query.filter_by(
            daily_item_id=item.id,
            receipt_date=today
        ).first()
        
        item_dict['received_today'] = today_receipt.quantity_received if today_receipt else 0
        item_dict['receipt_status'] = 'received' if today_receipt else 'pending'
        
        result.append(item_dict)
    
    return jsonify({
        'items': result,
        'total': len(result),
        'date': today.isoformat()
    }), 200


@daily_items_bp.route('', methods=['POST'])
@jwt_required()
def create_daily_item():
    """Create a new daily item configuration"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    item = DailyItem(
        user_id=user_id,
        inventory_item_id=data.get('inventory_item_id'),
        name=data['name'],
        category=data.get('category', 'Perishables'),
        unit=data.get('unit', 'units'),
        expected_daily_quantity=data.get('expected_daily_quantity', 0),
        min_daily_quantity=data.get('min_daily_quantity', 0),
        shelf_life_hours=data.get('shelf_life_hours', 24),
        vendor_id=data.get('vendor_id'),
        cost_per_unit=data.get('cost_per_unit', 0),
        is_active=True,
        auto_order=data.get('auto_order', True)
    )
    
    db.session.add(item)
    db.session.commit()
    
    return jsonify({
        'message': 'Daily item created',
        'item': item.to_dict()
    }), 201


@daily_items_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_daily_item(item_id):
    """Update a daily item configuration"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    item = DailyItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    # Update fields
    for field in ['name', 'category', 'unit', 'expected_daily_quantity', 
                  'min_daily_quantity', 'shelf_life_hours', 'vendor_id',
                  'cost_per_unit', 'is_active', 'auto_order']:
        if field in data:
            setattr(item, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Daily item updated',
        'item': item.to_dict()
    }), 200


@daily_items_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_daily_item(item_id):
    """Delete (deactivate) a daily item"""
    user_id = int(get_jwt_identity())
    
    item = DailyItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    item.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Daily item deactivated'}), 200


@daily_items_bp.route('/receive', methods=['POST'])
@jwt_required()
def log_daily_receipt():
    """Log receipt of daily items"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('daily_item_id') or data.get('quantity_received') is None:
        return jsonify({'error': 'daily_item_id and quantity_received are required'}), 400
    
    item = DailyItem.query.filter_by(
        id=data['daily_item_id'],
        user_id=user_id
    ).first()
    
    if not item:
        return jsonify({'error': 'Daily item not found'}), 404
    
    receipt = DailyItemReceipt(
        daily_item_id=item.id,
        user_id=user_id,
        quantity_received=data['quantity_received'],
        quantity_expected=item.expected_daily_quantity,
        cost=data.get('cost', data['quantity_received'] * item.cost_per_unit),
        receipt_date=datetime.utcnow().date(),
        receipt_time=datetime.utcnow().time(),
        quality_ok=data.get('quality_ok', True),
        notes=data.get('notes')
    )
    
    db.session.add(receipt)
    
    # Update item tracking
    item.last_received_date = datetime.utcnow().date()
    item.last_received_quantity = data['quantity_received']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Receipt logged successfully',
        'receipt': receipt.to_dict()
    }), 201


@daily_items_bp.route('/receive/bulk', methods=['POST'])
@jwt_required()
def bulk_log_receipts():
    """Log multiple daily item receipts at once"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('receipts'):
        return jsonify({'error': 'No receipts provided'}), 400
    
    logged = 0
    errors = []
    
    for receipt_data in data['receipts']:
        item_id = receipt_data.get('daily_item_id')
        quantity = receipt_data.get('quantity_received')
        
        if not item_id or quantity is None:
            errors.append({'error': 'Missing daily_item_id or quantity'})
            continue
        
        item = DailyItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            errors.append({'item_id': item_id, 'error': 'Item not found'})
            continue
        
        receipt = DailyItemReceipt(
            daily_item_id=item.id,
            user_id=user_id,
            quantity_received=quantity,
            quantity_expected=item.expected_daily_quantity,
            cost=quantity * item.cost_per_unit,
            receipt_date=datetime.utcnow().date(),
            receipt_time=datetime.utcnow().time(),
            quality_ok=receipt_data.get('quality_ok', True),
            notes=receipt_data.get('notes')
        )
        
        db.session.add(receipt)
        
        item.last_received_date = datetime.utcnow().date()
        item.last_received_quantity = quantity
        
        logged += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'Logged {logged} receipts',
        'logged': logged,
        'errors': errors
    }), 201


@daily_items_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_daily_summary():
    """Get daily items summary with order needs"""
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()
    
    items = DailyItem.query.filter_by(user_id=user_id, is_active=True).all()
    
    pending_items = []
    received_items = []
    total_expected_cost = 0
    total_received_cost = 0
    
    for item in items:
        receipt = DailyItemReceipt.query.filter_by(
            daily_item_id=item.id,
            receipt_date=today
        ).first()
        
        item_data = {
            'id': item.id,
            'name': item.name,
            'category': item.category,
            'expected_quantity': item.expected_daily_quantity,
            'cost_per_unit': item.cost_per_unit,
            'expected_cost': item.expected_daily_quantity * item.cost_per_unit,
            'vendor_id': item.vendor_id
        }
        
        if receipt:
            item_data['received_quantity'] = receipt.quantity_received
            item_data['actual_cost'] = receipt.cost
            item_data['quality_ok'] = receipt.quality_ok
            received_items.append(item_data)
            total_received_cost += receipt.cost or 0
        else:
            pending_items.append(item_data)
            total_expected_cost += item.expected_daily_quantity * item.cost_per_unit
    
    return jsonify({
        'date': today.isoformat(),
        'total_items': len(items),
        'received': len(received_items),
        'pending': len(pending_items),
        'total_expected_cost': round(total_expected_cost, 2),
        'total_received_cost': round(total_received_cost, 2),
        'pending_items': pending_items,
        'received_items': received_items
    }), 200


@daily_items_bp.route('/auto-order', methods=['POST'])
@jwt_required()
def generate_daily_order():
    """Generate automatic daily order for all auto-order items"""
    user_id = int(get_jwt_identity())
    
    items = DailyItem.query.filter_by(
        user_id=user_id,
        is_active=True,
        auto_order=True
    ).all()
    
    if not items:
        return jsonify({
            'message': 'No items configured for auto-order',
            'order_items': []
        }), 200
    
    # Group by vendor
    vendor_orders = {}
    
    for item in items:
        vendor_id = item.vendor_id or 0
        if vendor_id not in vendor_orders:
            vendor_orders[vendor_id] = {
                'vendor_id': vendor_id,
                'items': [],
                'total': 0
            }
        
        order_qty = item.expected_daily_quantity
        cost = order_qty * item.cost_per_unit
        
        vendor_orders[vendor_id]['items'].append({
            'daily_item_id': item.id,
            'name': item.name,
            'quantity': order_qty,
            'unit': item.unit,
            'cost_per_unit': item.cost_per_unit,
            'total_cost': cost
        })
        vendor_orders[vendor_id]['total'] += cost
    
    return jsonify({
        'date': datetime.utcnow().date().isoformat(),
        'vendor_orders': list(vendor_orders.values()),
        'total_vendors': len(vendor_orders),
        'grand_total': sum(v['total'] for v in vendor_orders.values())
    }), 200
