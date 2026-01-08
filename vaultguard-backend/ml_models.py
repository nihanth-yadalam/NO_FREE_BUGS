"""
VaultGuard Backend - ML Prediction Models
Adapted from final_version.py for API use
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import random


class IncomePredictor:
    """
    Model A: Income Predictor with Hybrid Cold-Start Logic
    Predicts future income based on transaction history
    """
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
    
    def prepare_features(self, transactions: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Prepare features from transaction history for income prediction
        Income = deposits (where receiver_account is our account)
        """
        if not transactions:
            return pd.DataFrame()
        
        # Sort by timestamp
        df = pd.DataFrame(transactions)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df = df.sort_values('timestamp')
        
        # Group by date and sum income (deposits)
        daily_income = df.groupby(df['timestamp'].dt.date)['amount'].sum().reset_index()
        daily_income.columns = ['date', 'income']
        daily_income['date'] = pd.to_datetime(daily_income['date'])
        daily_income['income'] = pd.to_numeric(daily_income['income'], errors='coerce').fillna(0)
        
        # Add features
        data = []
        history = list(daily_income['income'].values)
        
        for i, row in daily_income.iterrows():
            day_of_week = row['date'].weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            
            idx = list(daily_income['date']).index(row['date'])
            lag_1 = float(history[idx - 1]) if idx > 0 else 0.0
            rolling_7 = sum(float(h) for h in history[max(0, idx-7):idx]) / max(1, min(7, idx)) if idx > 0 else 0.0
            
            data.append({
                'date': row['date'],
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'lag_1_income': lag_1,
                'rolling_avg': rolling_7,
                'target': float(row['income'])
            })
        
        return pd.DataFrame(data)
    
    def train_and_predict(self, income_transactions: List[Dict], days_to_predict: int = 15) -> Dict[str, Any]:
        """
        Train the model and predict future income
        """
        df = self.prepare_features(income_transactions)
        days_history = len(df)
        
        if days_history == 0:
            return {
                'predicted_income': 0,
                'daily_average': 0,
                'confidence': 0,
                'method': 'no_data',
                'safety_factor': 0.7
            }
        
        # Statistical prediction (baseline)
        statistical_daily_avg = df['target'].mean() if not df.empty else 0
        statistical_total_pred = statistical_daily_avg * days_to_predict
        
        # ML prediction
        ml_total_pred = 0
        features = ['day_of_week', 'is_weekend', 'lag_1_income', 'rolling_avg']
        
        if days_history >= 5:
            self.model.fit(df[features], df['target'])
            self.is_trained = True
            
            # Predict future days
            history = list(df['target'].values)
            curr_lag = history[-1] if history else 0
            curr_rolling = sum(history[-7:]) / min(7, len(history)) if history else 0
            
            last_date = df['date'].max()
            
            for d in range(days_to_predict):
                future_date = last_date + timedelta(days=d+1)
                dow = future_date.weekday()
                is_weekend = 1 if dow >= 5 else 0
                
                input_data = pd.DataFrame([{
                    'day_of_week': dow,
                    'is_weekend': is_weekend,
                    'lag_1_income': curr_lag,
                    'rolling_avg': curr_rolling
                }])
                
                daily_pred = max(0, self.model.predict(input_data)[0])
                ml_total_pred += daily_pred
                
                curr_lag = daily_pred
                curr_rolling = ((curr_rolling * 6) + daily_pred) / 7
        
        # Hybrid strategy based on history length
        if days_history < 30:
            weight_ml = 0.0
            weight_stat = 1.0
            method = 'statistical_only'
        elif days_history < 90:
            weight_ml = 0.7
            weight_stat = 0.3
            method = 'hybrid'
        else:
            weight_ml = 0.9
            weight_stat = 0.1
            method = 'ml_primary'
        
        # Weighted blend
        final_raw_prediction = (ml_total_pred * weight_ml) + (statistical_total_pred * weight_stat)
        
        # Volatility-based safety factor
        volatility = df['target'].std() if len(df) > 1 else 0
        
        if volatility > 2000:
            safety_factor = 0.70
        elif volatility > 500:
            safety_factor = 0.85
        else:
            safety_factor = 0.95
        
        safe_income = final_raw_prediction * safety_factor
        
        # Confidence based on data amount and volatility
        confidence = min(95, 50 + (days_history * 0.5) - (volatility / 100))
        
        return {
            'predicted_income': round(safe_income, 2),
            'raw_prediction': round(final_raw_prediction, 2),
            'ml_prediction': round(ml_total_pred, 2),
            'statistical_prediction': round(statistical_total_pred, 2),
            'daily_average': round(statistical_daily_avg, 2),
            'confidence': round(max(0, min(100, confidence)), 1),
            'method': method,
            'safety_factor': safety_factor,
            'days_history': days_history,
            'volatility': round(volatility, 2)
        }


class ExpenseForecaster:
    """
    Model B: Expense Forecaster with Aggregated Daily Logic
    Predicts future expenses based on spending patterns
    """
    
    def prepare_daily_expenses(self, expense_transactions: List[Dict]) -> List[float]:
        """
        Aggregate expenses by day
        """
        if not expense_transactions:
            return []
        
        df = pd.DataFrame(expense_transactions)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        
        # Group by date
        daily_spend = df.groupby(df['timestamp'].dt.date)['amount'].sum()
        
        return [float(x) for x in daily_spend.values]
    
    def predict(self, expense_transactions: List[Dict], days_to_predict: int = 15) -> Dict[str, Any]:
        """
        Predict future expenses
        """
        daily_spend_history = self.prepare_daily_expenses(expense_transactions)
        
        if not daily_spend_history:
            return {
                'predicted_expenses': 0,
                'daily_run_rate': 0,
                'confidence': 0,
                'method': 'no_data'
            }
        
        # Calculate daily run rate
        if len(daily_spend_history) < 14:
            daily_run_rate = np.mean(daily_spend_history)
            method = 'simple_average'
        else:
            # Weekly weighted average
            weekly_totals = []
            for i in range(0, len(daily_spend_history), 7):
                chunk = daily_spend_history[i:i+7]
                if len(chunk) == 7:
                    weekly_totals.append(sum(chunk))
            
            if len(weekly_totals) >= 4:
                recent_weeks = weekly_totals[-4:]
                weights = [0.1, 0.2, 0.3, 0.4]
                weighted_weekly = sum([s*w for s, w in zip(recent_weeks, weights)])
                daily_run_rate = weighted_weekly / 7
                method = 'weighted_weekly'
            else:
                daily_run_rate = np.mean(daily_spend_history)
                method = 'simple_average'
        
        # Apply safety buffer (overestimate expenses to be safe)
        safety_buffer = 1.10
        predicted_expense = (daily_run_rate * days_to_predict) * safety_buffer
        
        # Confidence based on data consistency
        std_dev = np.std(daily_spend_history) if len(daily_spend_history) > 1 else 0
        cv = std_dev / daily_run_rate if daily_run_rate > 0 else 1
        confidence = max(0, min(95, 80 - (cv * 30)))
        
        return {
            'predicted_expenses': round(predicted_expense, 2),
            'daily_run_rate': round(daily_run_rate, 2),
            'confidence': round(confidence, 1),
            'method': method,
            'days_analyzed': len(daily_spend_history),
            'safety_buffer': safety_buffer
        }


class VaultGuardPredictor:
    """
    Main predictor class combining income and expense forecasting
    """
    
    def __init__(self):
        self.income_predictor = IncomePredictor()
        self.expense_forecaster = ExpenseForecaster()
    
    def analyze_transactions(self, transactions: List[Dict], user_account: str) -> Tuple[List[Dict], List[Dict]]:
        """
        Separate transactions into income and expenses
        """
        income_transactions = []
        expense_transactions = []
        
        for txn in transactions:
            if txn.get('receiver_account') == user_account and txn.get('sender_account') != 'EXTERNAL_DEPOSIT':
                # This is income from another account
                income_transactions.append(txn)
            elif txn.get('sender_account') == 'EXTERNAL_DEPOSIT' and txn.get('receiver_account') == user_account:
                # This is a deposit (income)
                income_transactions.append(txn)
            elif txn.get('sender_account') == user_account:
                # This is an expense
                expense_transactions.append(txn)
        
        return income_transactions, expense_transactions
    
    def get_full_prediction(
        self,
        transactions: List[Dict],
        user_account: str,
        current_balance: float,
        fixed_bills: float = 0,
        days_left: int = 15
    ) -> Dict[str, Any]:
        """
        Get complete financial prediction
        """
        income_txns, expense_txns = self.analyze_transactions(transactions, user_account)
        
        # Get predictions
        income_prediction = self.income_predictor.train_and_predict(income_txns, days_left)
        expense_prediction = self.expense_forecaster.predict(expense_txns, days_left)
        
        # Calculate safe to spend
        total_liquidity = current_balance + income_prediction['predicted_income']
        total_obligations = fixed_bills + expense_prediction['predicted_expenses']
        safe_withdrawable = total_liquidity - total_obligations
        
        # Overall confidence (weighted average)
        overall_confidence = (
            income_prediction['confidence'] * 0.4 +
            expense_prediction['confidence'] * 0.6
        )
        
        return {
            'current_balance': float(current_balance),
            'income_prediction': income_prediction,
            'expense_prediction': expense_prediction,
            'fixed_bills': float(fixed_bills),
            'total_liquidity': round(float(total_liquidity), 2),
            'total_obligations': round(float(total_obligations), 2),
            'safe_to_spend': round(float(max(0, safe_withdrawable)), 2),
            'is_safe': bool(safe_withdrawable > 0),
            'deficit': round(float(abs(min(0, safe_withdrawable))), 2),
            'overall_confidence': round(float(overall_confidence), 1),
            'days_forecast': int(days_left),
            'analysis': {
                'income_transactions_count': len(income_txns),
                'expense_transactions_count': len(expense_txns),
                'total_transactions': len(transactions)
            }
        }
    
    def get_historical_summary(self, transactions: List[Dict], user_account: str, months: int = 6) -> List[Dict]:
        """
        Generate historical monthly summary for charts
        """
        if not transactions:
            return []
        
        income_txns, expense_txns = self.analyze_transactions(transactions, user_account)
        
        # Convert to DataFrames
        all_txns = pd.DataFrame(transactions)
        all_txns['timestamp'] = pd.to_datetime(all_txns['timestamp'])
        
        # Get monthly summaries
        monthly_data = []
        
        # Group by month
        all_txns['month'] = all_txns['timestamp'].dt.to_period('M')
        
        for month in all_txns['month'].unique():
            month_txns = all_txns[all_txns['month'] == month]
            
            # Calculate income for this month
            month_income = 0
            month_expense = 0
            
            for _, txn in month_txns.iterrows():
                if txn['receiver_account'] == user_account:
                    month_income += float(txn['amount'])
                if txn['sender_account'] == user_account:
                    month_expense += float(txn['amount'])
            
            monthly_data.append({
                'month': str(month),
                'month_label': month.strftime('%b'),
                'income': round(month_income, 2),
                'expense': round(month_expense, 2),
                'balance': round(month_income - month_expense, 2)
            })
        
        return sorted(monthly_data, key=lambda x: x['month'])[-months:]


def categorize_expense(description: str, amount: float) -> str:
    """
    Categorize an expense based on description and amount
    """
    description_lower = description.lower()
    
    # Regular expenses (recurring bills)
    regular_keywords = ['rent', 'emi', 'subscription', 'insurance', 'bill', 'fees', 'electricity', 'water', 'gas', 'internet', 'phone']
    for keyword in regular_keywords:
        if keyword in description_lower:
            return 'regular'
    
    # Daily expenses
    daily_keywords = ['food', 'coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'snack', 'transport', 'auto', 'uber', 'ola', 'metro', 'bus']
    for keyword in daily_keywords:
        if keyword in description_lower:
            return 'daily'
    
    # Amount-based categorization
    if amount > 5000:
        return 'regular'
    elif amount < 500:
        return 'daily'
    
    return 'irregular'
