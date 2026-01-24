"""
Seed Script - Add Realistic Sample Data
For: Inventory, Sales, Daily Items, Forecasting
"""
import os
import sys
import random
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from app import create_app, db
from app.models import User
from app.models.inventory_models import InventoryItem, Vendor, LocalEvent
from app.models.sales_models import SalesRecord, DailyItem, DailyItemReceipt

# Realistic Indian Grocery Store Products
PRODUCTS = [
    # Dairy
    {"name": "Amul Milk 1L", "category": "Dairy", "cost": 28, "sell": 32, "unit": "packet", "shelf_days": 3, "daily": True},
    {"name": "Amul Butter 100g", "category": "Dairy", "cost": 52, "sell": 58, "unit": "pcs", "shelf_days": 30},
    {"name": "Mother Dairy Curd 400g", "category": "Dairy", "cost": 35, "sell": 40, "unit": "pcs", "shelf_days": 5, "daily": True},
    {"name": "Amul Paneer 200g", "category": "Dairy", "cost": 80, "sell": 95, "unit": "pcs", "shelf_days": 7, "daily": True},
    {"name": "Amul Cheese Slice 100g", "category": "Dairy", "cost": 85, "sell": 99, "unit": "pcs", "shelf_days": 60},
    
    # Groceries - Staples
    {"name": "Tata Salt 1kg", "category": "Groceries", "cost": 22, "sell": 28, "unit": "pcs", "shelf_days": 365},
    {"name": "Fortune Sunflower Oil 1L", "category": "Groceries", "cost": 140, "sell": 165, "unit": "bottle", "shelf_days": 180},
    {"name": "Aashirvaad Atta 5kg", "category": "Groceries", "cost": 245, "sell": 285, "unit": "bag", "shelf_days": 90},
    {"name": "India Gate Basmati Rice 5kg", "category": "Groceries", "cost": 420, "sell": 499, "unit": "bag", "shelf_days": 180},
    {"name": "Toor Dal 1kg", "category": "Groceries", "cost": 145, "sell": 170, "unit": "pcs", "shelf_days": 120},
    {"name": "Chana Dal 1kg", "category": "Groceries", "cost": 95, "sell": 115, "unit": "pcs", "shelf_days": 120},
    {"name": "Sugar 1kg", "category": "Groceries", "cost": 42, "sell": 50, "unit": "pcs", "shelf_days": 365},
    
    # Beverages
    {"name": "Coca Cola 750ml", "category": "Beverages", "cost": 35, "sell": 40, "unit": "bottle", "shelf_days": 120},
    {"name": "Pepsi 750ml", "category": "Beverages", "cost": 35, "sell": 40, "unit": "bottle", "shelf_days": 120},
    {"name": "Frooti Mango 200ml", "category": "Beverages", "cost": 10, "sell": 15, "unit": "pcs", "shelf_days": 90},
    {"name": "Red Label Tea 250g", "category": "Beverages", "cost": 115, "sell": 135, "unit": "pcs", "shelf_days": 365},
    {"name": "Nescafe Classic 50g", "category": "Beverages", "cost": 130, "sell": 155, "unit": "pcs", "shelf_days": 365},
    
    # Snacks
    {"name": "Lays Classic 52g", "category": "Snacks", "cost": 18, "sell": 20, "unit": "pcs", "shelf_days": 60},
    {"name": "Kurkure Masala 75g", "category": "Snacks", "cost": 18, "sell": 20, "unit": "pcs", "shelf_days": 60},
    {"name": "Parle-G 250g", "category": "Snacks", "cost": 22, "sell": 28, "unit": "pcs", "shelf_days": 90},
    {"name": "Britannia Good Day 75g", "category": "Snacks", "cost": 25, "sell": 30, "unit": "pcs", "shelf_days": 90},
    {"name": "Haldiram Bhujia 200g", "category": "Snacks", "cost": 65, "sell": 80, "unit": "pcs", "shelf_days": 60},
    
    # Personal Care
    {"name": "Dove Soap 100g", "category": "Personal Care", "cost": 42, "sell": 52, "unit": "pcs", "shelf_days": 730},
    {"name": "Colgate MaxFresh 80g", "category": "Personal Care", "cost": 55, "sell": 68, "unit": "pcs", "shelf_days": 730},
    {"name": "Dettol Handwash 200ml", "category": "Personal Care", "cost": 85, "sell": 105, "unit": "bottle", "shelf_days": 730},
    
    # Household
    {"name": "Surf Excel 1kg", "category": "Household", "cost": 165, "sell": 195, "unit": "pcs", "shelf_days": 730},
    {"name": "Vim Bar 300g", "category": "Household", "cost": 28, "sell": 35, "unit": "pcs", "shelf_days": 730},
    
    # Bread & Bakery
    {"name": "Britannia Brown Bread", "category": "Bakery", "cost": 35, "sell": 42, "unit": "pcs", "shelf_days": 3, "daily": True},
    {"name": "Britannia White Bread", "category": "Bakery", "cost": 32, "sell": 38, "unit": "pcs", "shelf_days": 3, "daily": True},
]

VENDORS = [
    {"name": "Reliance Fresh Wholesale", "contact": "Suresh Kumar", "phone": "9876543210", "email": "reliance.fresh@example.com"},
    {"name": "Metro Cash & Carry", "contact": "Rajesh Sharma", "phone": "9876543211", "email": "metro.india@example.com"},
    {"name": "Amul Distributor - Mumbai", "contact": "Amit Patel", "phone": "9876543212", "email": "amul.mumbai@example.com"},
    {"name": "Local Dairy Supplier", "contact": "Ramesh Yadav", "phone": "9876543213", "email": "ramesh.dairy@example.com"},
    {"name": "FMCG Direct Supply", "contact": "Priya Singh", "phone": "9876543214", "email": "fmcg.direct@example.com"},
]

LOCAL_EVENTS = [
    {"name": "Diwali Festival", "type": "festival", "impact": "very_high", "change": 150, "categories": ["Snacks", "Sweets", "Gifts", "Household"]},
    {"name": "Holi Festival", "type": "festival", "impact": "high", "change": 80, "categories": ["Beverages", "Snacks", "Colors"]},
    {"name": "Ganesh Chaturthi", "type": "festival", "impact": "high", "change": 60, "categories": ["Sweets", "Fruits", "Pooja Items"]},
    {"name": "Weekend Rush", "type": "weekly", "impact": "medium", "change": 25, "categories": ["All"]},
    {"name": "Summer Season", "type": "seasonal", "impact": "high", "change": 60, "categories": ["Beverages", "Ice Cream", "Dairy"]},
]


def seed_data():
    """Seed the database with realistic sample data"""
    app = create_app()
    
    with app.app_context():
        print("🌱 Starting data seeding...")
        
        # Get or create user
        user = User.query.first()
        if not user:
            print("❌ No user found. Please register first.")
            return
        
        user_id = user.id
        print(f"👤 Using user: {user.email} (ID: {user_id})")
        
        # =================================
        # 1. Seed Vendors
        # =================================
        print("\n📦 Adding vendors...")
        for v in VENDORS:
            existing = Vendor.query.filter_by(name=v['name'], user_id=user_id).first()
            if not existing:
                vendor = Vendor(
                    user_id=user_id,
                    name=v['name'],
                    contact_person=v['contact'],
                    phone=v['phone'],
                    email=v['email'],
                    address="Mumbai, Maharashtra"
                )
                db.session.add(vendor)
        db.session.commit()
        print(f"   ✅ {len(VENDORS)} vendors added")
        
        # =================================
        # 2. Seed Inventory Items
        # =================================
        print("\n📋 Adding inventory items...")
        today = datetime.now()
        
        for p in PRODUCTS:
            existing = InventoryItem.query.filter_by(name=p['name'], user_id=user_id).first()
            if not existing:
                base_stock = random.randint(20, 100)
                min_stock = random.randint(10, 30)
                shelf_days = max(10, p['shelf_days'])
                expiry_dt = today + timedelta(days=random.randint(5, shelf_days))
                
                item = InventoryItem(
                    user_id=user_id,
                    name=p['name'],
                    category=p['category'],
                    quantity=base_stock,
                    unit=p['unit'],
                    cost_price=p['cost'],
                    selling_price=p['sell'],
                    min_stock_level=min_stock,
                    expiry_date=expiry_dt if p['shelf_days'] < 100 else None
                )
                db.session.add(item)
        
        db.session.commit()
        print(f"   ✅ {len(PRODUCTS)} inventory items added")
        
        # =================================
        # 3. Seed Local Events
        # =================================
        print("\n📅 Adding local events...")
        for e in LOCAL_EVENTS:
            existing = LocalEvent.query.filter_by(name=e['name'], user_id=user_id).first()
            if not existing:
                start_dt = today + timedelta(days=random.randint(10, 60))
                end_dt = start_dt + timedelta(days=random.randint(1, 5))
                
                event = LocalEvent(
                    user_id=user_id,
                    name=e['name'],
                    event_type=e['type'],
                    start_date=start_dt,
                    end_date=end_dt,
                    expected_demand_change=e['change'],
                    affected_categories=e['categories']
                )
                db.session.add(event)
        db.session.commit()
        print(f"   ✅ {len(LOCAL_EVENTS)} local events added")
        
        # =================================
        # 4. Seed Sales Records (90 days)
        # =================================
        print("\n💰 Adding sales records (90 days)...")
        sales_count = 0
        sale_date = today.date()
        
        for day_offset in range(90, 0, -1):
            current_date = sale_date - timedelta(days=day_offset)
            is_weekend = current_date.weekday() >= 5
            
            for p in PRODUCTS:
                base_qty = random.randint(5, 25)
                if is_weekend:
                    base_qty = int(base_qty * 1.3)
                qty = max(1, base_qty + random.randint(-5, 10))
                
                sale = SalesRecord(
                    user_id=user_id,
                    product_name=p['name'],
                    category=p['category'],
                    quantity_sold=qty,
                    unit_price=p['sell'],
                    total_amount=qty * p['sell'],
                    sale_date=current_date
                )
                db.session.add(sale)
                sales_count += 1
            
            if day_offset % 10 == 0:
                db.session.commit()
                print(f"   ... processed {90 - day_offset} days")
        
        db.session.commit()
        print(f"   ✅ {sales_count} sales records added")
        
        # =================================
        # 5. Seed Daily Items
        # =================================
        print("\n🥛 Adding daily items...")
        daily_products = [p for p in PRODUCTS if p.get('daily')]
        
        for p in daily_products:
            existing = DailyItem.query.filter_by(name=p['name'], user_id=user_id).first()
            if not existing:
                daily = DailyItem(
                    user_id=user_id,
                    name=p['name'],
                    category=p['category'],
                    expected_daily_quantity=random.randint(20, 50),
                    unit=p['unit'],
                    cost_per_unit=p['cost'],
                    is_active=True
                )
                db.session.add(daily)
        
        db.session.commit()
        print(f"   ✅ {len(daily_products)} daily items added")
        
        # =================================
        # 6. Seed Daily Item Receipts (7 days)
        # =================================
        print("\n📝 Adding daily item receipts (7 days)...")
        daily_items = DailyItem.query.filter_by(user_id=user_id).all()
        receipt_count = 0
        
        for day_offset in range(7, 0, -1):
            receipt_date = sale_date - timedelta(days=day_offset)
            
            for di in daily_items:
                qty_received = di.expected_daily_quantity + random.randint(-5, 5)
                
                receipt = DailyItemReceipt(
                    daily_item_id=di.id,
                    user_id=user_id,
                    receipt_date=receipt_date,
                    quantity_received=qty_received,
                    quantity_expected=di.expected_daily_quantity,
                    cost=qty_received * di.cost_per_unit
                )
                db.session.add(receipt)
                receipt_count += 1
        
        db.session.commit()
        print(f"   ✅ {receipt_count} daily receipts added")
        
        print("\n" + "="*50)
        print("🎉 DATA SEEDING COMPLETE!")
        print("="*50)
        print(f"""
Summary:
  • Vendors: {len(VENDORS)}
  • Inventory Items: {len(PRODUCTS)}
  • Local Events: {len(LOCAL_EVENTS)}
  • Sales Records: {sales_count}
  • Daily Items: {len(daily_products)}
  • Daily Receipts: {receipt_count}
        """)


if __name__ == '__main__':
    seed_data()
