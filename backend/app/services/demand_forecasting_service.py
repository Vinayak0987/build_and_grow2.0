"""
Demand Forecasting Service
ML-powered demand prediction using historical sales data
"""
import os
import pickle
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict

try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


class DemandForecastingService:
    """
    ML-powered demand forecasting service
    Uses historical sales data to predict future demand
    """
    
    def __init__(self):
        self.models = {}  # product_name -> trained model
        self.scalers = {}  # product_name -> scaler
        self.model_dir = os.environ.get('MODEL_DIR', '/app/models/forecast')
        os.makedirs(self.model_dir, exist_ok=True)
    
    def train_forecast_model(
        self, 
        sales_data: List[Dict], 
        user_id: int,
        model_type: str = 'random_forest'
    ) -> Dict[str, Any]:
        """
        Train demand forecasting model from historical sales data
        
        Args:
            sales_data: List of sales records with product_name, quantity_sold, sale_date, etc.
            user_id: Owner of the model
            model_type: 'random_forest' or 'gradient_boosting'
            
        Returns:
            Training results with accuracy metrics
        """
        if not HAS_SKLEARN:
            return {'error': 'scikit-learn not installed', 'success': False}
        
        if not sales_data:
            return {'error': 'No sales data provided', 'success': False}
        
        # Group sales by product
        product_sales = defaultdict(list)
        for sale in sales_data:
            product_sales[sale['product_name']].append(sale)
        
        results = {
            'success': True,
            'products_trained': 0,
            'products_skipped': 0,
            'model_type': model_type,
            'product_results': []
        }
        
        for product_name, sales in product_sales.items():
            if len(sales) < 7:  # Need at least a week of data
                results['products_skipped'] += 1
                continue
            
            try:
                # Prepare features and target
                X, y = self._prepare_training_data(sales)
                
                if len(X) < 5:
                    results['products_skipped'] += 1
                    continue
                
                # Split data
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                
                # Scale features
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                # Train model
                if model_type == 'gradient_boosting':
                    model = GradientBoostingRegressor(
                        n_estimators=100,
                        max_depth=5,
                        random_state=42
                    )
                else:
                    model = RandomForestRegressor(
                        n_estimators=100,
                        max_depth=10,
                        random_state=42
                    )
                
                model.fit(X_train_scaled, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test_scaled)
                mae = mean_absolute_error(y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                mape = np.mean(np.abs((y_test - y_pred) / (y_test + 0.1))) * 100
                
                # Store model
                self.models[product_name] = model
                self.scalers[product_name] = scaler
                
                # Save to disk
                self._save_model(user_id, product_name, model, scaler)
                
                results['products_trained'] += 1
                results['product_results'].append({
                    'product_name': product_name,
                    'samples': len(sales),
                    'mae': round(mae, 2),
                    'rmse': round(rmse, 2),
                    'mape': round(mape, 2),
                    'accuracy': round(100 - mape, 2)
                })
                
            except Exception as e:
                results['product_results'].append({
                    'product_name': product_name,
                    'error': str(e)
                })
        
        return results
    
    def _prepare_training_data(self, sales: List[Dict]) -> tuple:
        """Prepare features and target from sales data"""
        # Aggregate sales by date
        daily_sales = defaultdict(float)
        for sale in sales:
            date_str = sale.get('sale_date')
            if isinstance(date_str, str):
                date = datetime.fromisoformat(date_str).date()
            else:
                date = date_str
            daily_sales[date] += sale.get('quantity_sold', 0)
        
        # Sort by date
        sorted_dates = sorted(daily_sales.keys())
        
        # Create features
        X = []
        y = []
        
        for i, date in enumerate(sorted_dates):
            features = [
                date.weekday(),  # Day of week (0-6)
                1 if date.weekday() >= 5 else 0,  # Is weekend
                date.day,  # Day of month
                date.month,  # Month
                date.isocalendar()[1],  # Week of year
            ]
            
            # Add lag features (previous day sales if available)
            if i > 0:
                features.append(daily_sales[sorted_dates[i-1]])
            else:
                features.append(0)
            
            # Add rolling average (last 3 days)
            if i >= 3:
                rolling_avg = np.mean([daily_sales[sorted_dates[j]] for j in range(i-3, i)])
                features.append(rolling_avg)
            else:
                features.append(daily_sales[date])
            
            X.append(features)
            y.append(daily_sales[date])
        
        return np.array(X), np.array(y)
    
    def predict_demand(
        self, 
        product_name: str, 
        user_id: int,
        days: int = 7,
        recent_sales: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Predict demand for the next N days
        
        Args:
            product_name: Name of product to predict
            user_id: User ID for model lookup
            days: Number of days to forecast
            recent_sales: Recent sales data for lag features
            
        Returns:
            Predictions with confidence intervals
        """
        # Load model if not in memory
        if product_name not in self.models:
            self._load_model(user_id, product_name)
        
        if product_name not in self.models:
            return {
                'error': f'No trained model for {product_name}',
                'success': False
            }
        
        model = self.models[product_name]
        scaler = self.scalers[product_name]
        
        predictions = []
        today = datetime.utcnow().date()
        
        # Get recent average for lag features
        recent_avg = 0
        if recent_sales:
            recent_avg = np.mean([s.get('quantity_sold', 0) for s in recent_sales[-7:]])
        
        for i in range(days):
            target_date = today + timedelta(days=i+1)
            
            # Create prediction features
            features = [
                target_date.weekday(),
                1 if target_date.weekday() >= 5 else 0,
                target_date.day,
                target_date.month,
                target_date.isocalendar()[1],
                recent_avg,  # Lag feature
                recent_avg   # Rolling average
            ]
            
            X = scaler.transform([features])
            pred = model.predict(X)[0]
            
            # Ensure non-negative
            pred = max(0, pred)
            
            # Estimate confidence interval (±20% for simplicity)
            lower = max(0, pred * 0.8)
            upper = pred * 1.2
            
            predictions.append({
                'date': target_date.isoformat(),
                'day_name': target_date.strftime('%A'),
                'predicted_quantity': round(pred, 1),
                'confidence_lower': round(lower, 1),
                'confidence_upper': round(upper, 1)
            })
            
            # Update recent average for next prediction
            recent_avg = (recent_avg * 6 + pred) / 7
        
        return {
            'success': True,
            'product_name': product_name,
            'forecast_date': today.isoformat(),
            'predictions': predictions,
            'total_predicted': round(sum(p['predicted_quantity'] for p in predictions), 1)
        }
    
    def get_all_forecasts(
        self, 
        user_id: int, 
        product_names: List[str],
        days: int = 7,
        recent_sales_by_product: Dict[str, List[Dict]] = None
    ) -> Dict[str, Any]:
        """Get forecasts for all products"""
        results = {
            'forecasts': [],
            'total_products': len(product_names),
            'successful': 0,
            'failed': 0
        }
        
        for product in product_names:
            recent = recent_sales_by_product.get(product, []) if recent_sales_by_product else []
            forecast = self.predict_demand(product, user_id, days, recent)
            
            if forecast.get('success'):
                results['forecasts'].append(forecast)
                results['successful'] += 1
            else:
                results['failed'] += 1
        
        return results
    
    def get_accuracy_metrics(self, user_id: int, forecast_results: List[Dict]) -> Dict[str, Any]:
        """
        Calculate accuracy metrics from forecast vs actual
        
        Args:
            forecast_results: List of forecasts with actual_quantity filled in
            
        Returns:
            MAPE, RMSE, and other accuracy metrics
        """
        if not forecast_results:
            return {'error': 'No forecast results to evaluate'}
        
        predictions = []
        actuals = []
        
        for result in forecast_results:
            if result.get('actual_quantity') is not None:
                predictions.append(result.get('predicted_quantity', 0))
                actuals.append(result.get('actual_quantity', 0))
        
        if not predictions:
            return {'error': 'No results with actual quantities'}
        
        predictions = np.array(predictions)
        actuals = np.array(actuals)
        
        # Calculate metrics
        mae = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        
        # MAPE (avoid division by zero)
        mape = np.mean(np.abs((actuals - predictions) / (actuals + 0.1))) * 100
        
        # Accuracy percentage
        accuracy = 100 - mape
        
        return {
            'total_forecasts': len(predictions),
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'mape': round(mape, 2),
            'accuracy_percent': round(accuracy, 2),
            'best_prediction': {
                'error': round(min(abs(actuals - predictions)), 2)
            },
            'worst_prediction': {
                'error': round(max(abs(actuals - predictions)), 2)
            }
        }
    
    def _save_model(self, user_id: int, product_name: str, model, scaler):
        """Save model to disk"""
        safe_name = product_name.replace(' ', '_').replace('/', '_')
        model_path = os.path.join(self.model_dir, f"user_{user_id}_{safe_name}_model.pkl")
        scaler_path = os.path.join(self.model_dir, f"user_{user_id}_{safe_name}_scaler.pkl")
        
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
    
    def _load_model(self, user_id: int, product_name: str):
        """Load model from disk"""
        safe_name = product_name.replace(' ', '_').replace('/', '_')
        model_path = os.path.join(self.model_dir, f"user_{user_id}_{safe_name}_model.pkl")
        scaler_path = os.path.join(self.model_dir, f"user_{user_id}_{safe_name}_scaler.pkl")
        
        try:
            with open(model_path, 'rb') as f:
                self.models[product_name] = pickle.load(f)
            with open(scaler_path, 'rb') as f:
                self.scalers[product_name] = pickle.load(f)
        except FileNotFoundError:
            pass


# Singleton instance
_forecast_service = None

def get_forecast_service() -> DemandForecastingService:
    """Get or create the forecast service instance"""
    global _forecast_service
    if _forecast_service is None:
        _forecast_service = DemandForecastingService()
    return _forecast_service
