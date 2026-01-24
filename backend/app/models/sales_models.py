"""
Sales & Forecasting Models
Database models for sales tracking, demand forecasting, and weekly reviews
"""
from datetime import datetime, timedelta
from app import db
from sqlalchemy import JSON


class SalesRecord(db.Model):
    """Individual sale transaction record"""
    __tablename__ = 'sales_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=True)
    
    # Product info (denormalized for historical accuracy)
    product_name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    sku = db.Column(db.String(100))
    
    # Sale details
    quantity_sold = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    
    # Time tracking
    sale_date = db.Column(db.Date, nullable=False, index=True)
    sale_time = db.Column(db.Time)
    
    # Additional context
    day_of_week = db.Column(db.Integer)  # 0=Monday, 6=Sunday
    week_of_year = db.Column(db.Integer)
    month = db.Column(db.Integer)
    is_weekend = db.Column(db.Boolean, default=False)
    is_holiday = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('sales_records', lazy='dynamic'))
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-calculate time features
        if self.sale_date:
            self.day_of_week = self.sale_date.weekday()
            self.week_of_year = self.sale_date.isocalendar()[1]
            self.month = self.sale_date.month
            self.is_weekend = self.day_of_week >= 5
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'category': self.category,
            'sku': self.sku,
            'quantity_sold': self.quantity_sold,
            'unit_price': self.unit_price,
            'total_amount': self.total_amount,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'sale_time': self.sale_time.isoformat() if self.sale_time else None,
            'day_of_week': self.day_of_week,
            'is_weekend': self.is_weekend,
            'is_holiday': self.is_holiday,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DailyItem(db.Model):
    """Perishable items that require daily restocking (milk, paneer, buttermilk, etc.)"""
    __tablename__ = 'daily_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=True)
    
    # Item info
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    unit = db.Column(db.String(50), default='units')
    
    # Daily settings
    expected_daily_quantity = db.Column(db.Float, default=0)  # How much to order daily
    min_daily_quantity = db.Column(db.Float, default=0)  # Minimum to maintain
    shelf_life_hours = db.Column(db.Integer, default=24)  # How long before expiry
    
    # Vendor info
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    cost_per_unit = db.Column(db.Float, default=0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    auto_order = db.Column(db.Boolean, default=True)  # Auto-generate daily orders
    
    # Tracking
    last_received_date = db.Column(db.Date)
    last_received_quantity = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('daily_items', lazy='dynamic'))
    vendor = db.relationship('Vendor', backref=db.backref('daily_items', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'unit': self.unit,
            'expected_daily_quantity': self.expected_daily_quantity,
            'min_daily_quantity': self.min_daily_quantity,
            'shelf_life_hours': self.shelf_life_hours,
            'vendor_id': self.vendor_id,
            'cost_per_unit': self.cost_per_unit,
            'is_active': self.is_active,
            'auto_order': self.auto_order,
            'last_received_date': self.last_received_date.isoformat() if self.last_received_date else None,
            'last_received_quantity': self.last_received_quantity
        }


class DailyItemReceipt(db.Model):
    """Log of daily item receipts"""
    __tablename__ = 'daily_item_receipts'
    
    id = db.Column(db.Integer, primary_key=True)
    daily_item_id = db.Column(db.Integer, db.ForeignKey('daily_items.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    quantity_received = db.Column(db.Float, nullable=False)
    quantity_expected = db.Column(db.Float)
    cost = db.Column(db.Float)
    
    receipt_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    receipt_time = db.Column(db.Time)
    
    # Quality check
    quality_ok = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    daily_item = db.relationship('DailyItem', backref=db.backref('receipts', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'daily_item_id': self.daily_item_id,
            'quantity_received': self.quantity_received,
            'quantity_expected': self.quantity_expected,
            'cost': self.cost,
            'receipt_date': self.receipt_date.isoformat() if self.receipt_date else None,
            'quality_ok': self.quality_ok,
            'notes': self.notes
        }


class MarketTrend(db.Model):
    """Market price trends and external factors"""
    __tablename__ = 'market_trends'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Product/Category
    product_name = db.Column(db.String(255))
    category = db.Column(db.String(100))
    
    # Price info
    current_price = db.Column(db.Float)
    previous_price = db.Column(db.Float)
    price_change_percent = db.Column(db.Float)
    
    # Trend info
    trend_direction = db.Column(db.String(20))  # 'up', 'down', 'stable'
    trend_reason = db.Column(db.Text)  # e.g., "Festival season", "Supply shortage"
    
    # Validity
    valid_from = db.Column(db.Date)
    valid_until = db.Column(db.Date)
    
    # Source
    source = db.Column(db.String(100))  # "manual", "api", etc.
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'category': self.category,
            'current_price': self.current_price,
            'previous_price': self.previous_price,
            'price_change_percent': self.price_change_percent,
            'trend_direction': self.trend_direction,
            'trend_reason': self.trend_reason,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None
        }


class ForecastResult(db.Model):
    """Saved demand forecast predictions for accuracy tracking"""
    __tablename__ = 'forecast_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Model info
    model_type = db.Column(db.String(50))  # 'xgboost', 'prophet', 'arima'
    model_version = db.Column(db.String(50))
    
    # Forecast details
    forecast_date = db.Column(db.Date, nullable=False)  # When forecast was made
    target_date = db.Column(db.Date, nullable=False)  # Date being predicted
    
    # Product
    product_name = db.Column(db.String(255))
    category = db.Column(db.String(100))
    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=True)
    
    # Predictions
    predicted_quantity = db.Column(db.Float, nullable=False)
    confidence_lower = db.Column(db.Float)  # Lower bound
    confidence_upper = db.Column(db.Float)  # Upper bound
    
    # Actual (filled in later)
    actual_quantity = db.Column(db.Float)
    
    # Accuracy (calculated after actual is known)
    error = db.Column(db.Float)  # actual - predicted
    error_percent = db.Column(db.Float)  # percentage error
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_type': self.model_type,
            'forecast_date': self.forecast_date.isoformat() if self.forecast_date else None,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'product_name': self.product_name,
            'category': self.category,
            'predicted_quantity': self.predicted_quantity,
            'confidence_lower': self.confidence_lower,
            'confidence_upper': self.confidence_upper,
            'actual_quantity': self.actual_quantity,
            'error': self.error,
            'error_percent': self.error_percent
        }


class WeeklyReview(db.Model):
    """Weekly performance review and suggestions"""
    __tablename__ = 'weekly_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Week info
    week_start = db.Column(db.Date, nullable=False)
    week_end = db.Column(db.Date, nullable=False)
    
    # Performance metrics
    total_predictions = db.Column(db.Integer, default=0)
    accuracy_percent = db.Column(db.Float)  # Overall accuracy
    mape = db.Column(db.Float)  # Mean Absolute Percentage Error
    rmse = db.Column(db.Float)  # Root Mean Square Error
    
    # Sales summary
    total_sales = db.Column(db.Float)
    total_items_sold = db.Column(db.Integer)
    top_selling_products = db.Column(JSON)  # List of top products
    
    # Inventory summary
    stockouts = db.Column(db.Integer, default=0)  # Items that went out of stock
    overstock_items = db.Column(db.Integer, default=0)
    wastage_items = db.Column(db.Integer, default=0)  # Expired items
    
    # AI Suggestions
    suggestions = db.Column(JSON)  # List of improvement suggestions
    ai_insights = db.Column(db.Text)  # Generated AI analysis
    
    # Actions
    actions_taken = db.Column(JSON)  # What was done based on suggestions
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'week_start': self.week_start.isoformat() if self.week_start else None,
            'week_end': self.week_end.isoformat() if self.week_end else None,
            'total_predictions': self.total_predictions,
            'accuracy_percent': self.accuracy_percent,
            'mape': self.mape,
            'rmse': self.rmse,
            'total_sales': self.total_sales,
            'total_items_sold': self.total_items_sold,
            'top_selling_products': self.top_selling_products,
            'stockouts': self.stockouts,
            'overstock_items': self.overstock_items,
            'wastage_items': self.wastage_items,
            'suggestions': self.suggestions,
            'ai_insights': self.ai_insights,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
