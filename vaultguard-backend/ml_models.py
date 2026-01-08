"""
ML Models for VaultGuard - Income Prediction and Expense Forecasting
Based on final_version.py with enhancements for API integration
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import random


class IncomePredictor:
    """
    Hybrid income predictor with cold-start logic.
    Combines ML predictions with statistical fallback based on data availability.
    """
    
    def __init__(self, user_type: str = 'freelancer'):
        self.user_type = user_type
        self.model = None
        
    def prepare_features(self, transactions: List[Dict]) -> pd.DataFrame:
        """Convert transactions to feature DataFrame for training"""
        # Filter income transactions (deposits)
        income_data = []
        
        # Group by date and sum incomes
        daily_income = {}
        for tx in transactions:
            if tx.get('sender_account') == 'EXTERNAL_DEPOSIT':
                date = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00')).date()
                daily_income[date] = daily_income.get(date, 0) + float(tx['amount'])
        
        # Sort by date
        sorted_dates = sorted(daily_income.keys())
        history = []
        
        for i, date in enumerate(sorted_dates):
            day_of_week = date.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            income = daily_income[date]
            
            lag_1 = history[-1] if history else 0
            rolling_7 = sum(history[-7:]) / 7 if len(history) >= 7 else (sum(history) / len(history) if history else 0)
            
            income_data.append({
                'date': date,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'lag_1_income': lag_1,
                'rolling_avg': rolling_7,
                'target': income
            })
            history.append(income)
        
        return pd.DataFrame(income_data), history
    
    def train_and_predict(self, transactions: List[Dict], days_left: int = 15) -> Dict:
        """Train model and predict future income"""
        df, history = self.prepare_features(transactions)
        days_history = len(df)
        
        if days_history == 0:
            return {
                'predicted_income': 0,
                'daily_average': 0,
                'confidence': 0,
                'method': 'no_data',
                'days_history': 0
            }
        
        # Statistical prediction (baseline)
        statistical_daily_avg = df['target'].mean() if not df.empty else 0
        statistical_total_pred = statistical_daily_avg * days_left
        
        # ML prediction
        ml_total_pred = 0
        
        if days_history >= 5:
            features = ['day_of_week', 'is_weekend', 'lag_1_income', 'rolling_avg']
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(df[features], df['target'])
            
            curr_lag = history[-1] if history else 0
            curr_rolling = sum(history[-7:]) / 7 if len(history) >= 7 else (sum(history) / len(history) if history else 0)
            
            for d in range(days_left):
                future_day_idx = days_history + d
                dow = future_day_idx % 7
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
        
        # Hybrid strategy (cold start logic)
        if days_history < 30:
            weight_ml, weight_stat = 0.0, 1.0
            method = 'statistical'
            confidence = min(50, days_history * 2)
        elif days_history < 90:
            weight_ml, weight_stat = 0.7, 0.3
            method = 'hybrid'
            confidence = 50 + min(30, (days_history - 30))
        else:
            weight_ml, weight_stat = 0.9, 0.1
            method = 'ml'
            confidence = 80 + min(15, (days_history - 90) // 10)
        
        final_raw_prediction = (ml_total_pred * weight_ml) + (statistical_total_pred * weight_stat)
        
        # Volatility safety factor
        volatility = df['target'].std() if len(df) > 1 else 0
        
        if volatility > 2000:
            safety_factor = 0.70
        elif volatility > 500:
            safety_factor = 0.85
        else:
            safety_factor = 0.95
        
        safe_income = final_raw_prediction * safety_factor
        
        return {
            'predicted_income': float(round(safe_income, 2)),
            'raw_prediction': float(round(final_raw_prediction, 2)),
            'ml_prediction': float(round(ml_total_pred, 2)),
            'statistical_prediction': float(round(statistical_total_pred, 2)),
            'daily_average': float(round(statistical_daily_avg, 2)),
            'confidence': int(min(95, confidence)),
            'method': method,
            'safety_factor': float(safety_factor),
            'volatility': float(round(volatility, 2)),
            'days_history': int(days_history)
        }


class ExpenseForecaster:
    """
    Expense forecaster using weighted average of recent spending patterns
    """
    
    def prepare_daily_expenses(self, transactions: List[Dict], account_number: str) -> List[float]:
        """Convert transactions to daily expense totals"""
        daily_expenses = {}
        
        for tx in transactions:
            # Withdrawals are expenses
            if tx.get('sender_account') == account_number or tx.get('receiver_account') == 'CASH_WITHDRAWAL':
                date = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00')).date()
                daily_expenses[date] = daily_expenses.get(date, 0) + float(tx['amount'])
        
        # Sort by date and return values
        sorted_dates = sorted(daily_expenses.keys())
        return [daily_expenses[d] for d in sorted_dates]
    
    def predict(self, transactions: List[Dict], account_number: str, days_left: int = 15) -> Dict:
        """Predict future expenses"""
        daily_spend_history = self.prepare_daily_expenses(transactions, account_number)
        
        if not daily_spend_history:
            return {
                'predicted_expense': 0,
                'daily_run_rate': 0,
                'confidence': 0,
                'method': 'no_data'
            }
        
        # Calculate daily run rate
        if len(daily_spend_history) < 14:
            daily_run_rate = np.mean(daily_spend_history)
            method = 'simple_average'
            confidence = min(50, len(daily_spend_history) * 4)
        else:
            # Weighted weekly average
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
                method = 'weighted_average'
                confidence = 70 + min(20, len(weekly_totals) * 2)
            else:
                daily_run_rate = np.mean(daily_spend_history)
                method = 'simple_average'
                confidence = 50 + min(20, len(daily_spend_history))
        
        # Apply safety buffer
        safety_buffer = 1.10
        predicted_expense = (daily_run_rate * days_left) * safety_buffer
        
        return {
            'predicted_expense': float(round(predicted_expense, 2)),
            'daily_run_rate': float(round(daily_run_rate, 2)),
            'confidence': int(min(90, confidence)),
            'method': method,
            'safety_buffer': float(safety_buffer),
            'days_analyzed': int(len(daily_spend_history))
        }


class VaultGuardPredictor:
    """
    Main predictor class that combines income and expense predictions
    """
    
    def __init__(self, user_type: str = 'freelancer'):
        self.income_predictor = IncomePredictor(user_type)
        self.expense_forecaster = ExpenseForecaster()
    
    def get_full_prediction(
        self,
        transactions: List[Dict],
        account_number: str,
        current_balance: float,
        days_left: int = 15,
        fixed_bills_due: float = 0
    ) -> Dict:
        """
        Generate comprehensive prediction including safe spending amount
        """
        # Get predictions
        income_pred = self.income_predictor.train_and_predict(transactions, days_left)
        expense_pred = self.expense_forecaster.predict(transactions, account_number, days_left)
        
        # Calculate safe withdrawable amount
        total_liquidity = current_balance + income_pred['predicted_income']
        total_obligations = fixed_bills_due + expense_pred['predicted_expense']
        safe_withdrawable = max(0, total_liquidity - total_obligations)
        
        # Calculate overall confidence
        avg_confidence = (income_pred['confidence'] + expense_pred['confidence']) / 2
        
        return {
            'income': income_pred,
            'expense': expense_pred,
            'summary': {
                'current_balance': float(current_balance),
                'predicted_income': float(income_pred['predicted_income']),
                'predicted_expense': float(expense_pred['predicted_expense']),
                'fixed_bills_due': float(fixed_bills_due),
                'total_liquidity': float(round(total_liquidity, 2)),
                'total_obligations': float(round(total_obligations, 2)),
                'safe_to_spend': float(round(safe_withdrawable, 2)),
                'days_left': int(days_left),
                'overall_confidence': float(round(avg_confidence, 1)),
                'is_safe': bool(safe_withdrawable > 0)
            }
        }
    
    def generate_chart_data(self, transactions: List[Dict], account_number: str) -> Dict:
        """Generate historical and predicted data for charts"""
        # Process transactions into monthly data
        monthly_data = {}
        
        for tx in transactions:
            date = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00'))
            month_key = date.strftime('%b')
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {'income': 0, 'expense': 0}
            
            if tx.get('sender_account') == 'EXTERNAL_DEPOSIT':
                monthly_data[month_key]['income'] += float(tx['amount'])
            elif tx.get('sender_account') == account_number:
                monthly_data[month_key]['expense'] += float(tx['amount'])
        
        # Convert to chart format
        chart_data = []
        for month, data in monthly_data.items():
            chart_data.append({
                'month': month,
                'income': round(data['income'], 2),
                'expense': round(data['expense'], 2),
                'balance': round(data['income'] - data['expense'], 2)
            })
        
        return {'historical': chart_data}
