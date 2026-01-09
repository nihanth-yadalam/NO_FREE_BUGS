"""
VaultGuard Backend API
Main FastAPI application for the VaultGuard financial management platform
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import random

from config import (
    DEFAULT_ACCOUNT_NUMBER,
    DEFAULT_IFSC_CODE,
    USER_NAME,
    USER_EMAIL,
    BANK_NAME,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from bank_service import BankAPIService, setup_demo_user
from ml_models import VaultGuardPredictor
from auth import (
    Token,
    UserLogin,
    UserRegister,
    User,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_user,
    add_user,
    hash_password,
    generate_unique_account_number
)

app = FastAPI(
    title="VaultGuard API",
    description="Backend API for VaultGuard - Financial Goal Management for Freelancers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
bank_service = BankAPIService()
predictor = VaultGuardPredictor(user_type='freelancer')


# Pydantic models for request/response
class UserProfile(BaseModel):
    name: str
    email: str
    bankName: str
    accountNumber: str
    ifscCode: str
    balance: float


class Expense(BaseModel):
    id: str
    name: str
    amount: float
    category: str  # "regular", "irregular", "daily"
    date: str


class ExpenseCreate(BaseModel):
    name: str
    amount: float
    category: str
    date: str


class IncomeCreate(BaseModel):
    amount: float
    description: str
    date: str


class BudgetSettings(BaseModel):
    monthly_budget: float
    fixed_bills: float
    days_in_month: int = 30


class PredictionResponse(BaseModel):
    predicted_income: float
    predicted_expense: float
    predicted_savings: float
    can_spend: float
    confidence: int
    income_details: Dict
    expense_details: Dict


class ChartData(BaseModel):
    month: str
    income: float
    expense: float
    balance: float
    isPredicted: Optional[bool] = False


# In-memory storage for expenses (in production, use a database)
expenses_db: Dict[str, Expense] = {}
budget_settings = BudgetSettings(monthly_budget=50000, fixed_bills=12000)


# ==================== Authentication Endpoints ====================
@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    """Authenticate user and return JWT token"""
    user = authenticate_user(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user info"""
    return current_user


@app.post("/api/auth/register", response_model=Token)
async def register(user_register: UserRegister):
    """Register a new user and return JWT token"""
    # Check if user already exists
    existing_user = get_user(user_register.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Validate password length
    if len(user_register.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long"
        )
    
    # Generate unique account number and IFSC code
    ifsc_code = "VAULT001"
    try:
        account_number = await generate_unique_account_number(bank_service, ifsc_code)
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate unique account number. Please try again."
        )
    
    # Generate random initial balance between 10,000 and 50,000
    initial_balance = random.randint(10000, 50000)
    
    # Create bank account first with initial balance
    try:
        await bank_service.create_user(account_number, ifsc_code, initial_balance)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create bank account: {str(e)}"
        )
    
    # Create new user in auth system
    try:
        hashed_password = hash_password(user_register.password)
        add_user(
            email=user_register.email,
            name=user_register.name,
            hashed_password=hashed_password,
            account_number=account_number,
            ifsc_code=ifsc_code
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Generate token for the new user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_register.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ==================== Health Check ====================
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        bank_health = await bank_service.health_check()
        return {
            "status": "UP",
            "message": "VaultGuard API is operational",
            "bank_api": bank_health.get("status", "UNKNOWN")
        }
    except Exception as e:
        return {
            "status": "UP",
            "message": "VaultGuard API is operational",
            "bank_api": "UNAVAILABLE",
            "error": str(e)
        }


# ==================== User Endpoints ====================
@app.get("/api/user/profile", response_model=UserProfile)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get the current user's profile including bank balance"""
    try:
        user_data = await bank_service.get_user(current_user.account_number, current_user.ifsc_code)
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found in bank")
        
        return UserProfile(
            name=current_user.name,
            email=current_user.email,
            bankName=BANK_NAME,
            accountNumber=user_data['account_number'],
            ifscCode=user_data['ifsc_code'],
            balance=float(user_data['balance'])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")


@app.post("/api/user/setup")
async def setup_user(current_user: User = Depends(get_current_active_user)):
    """Setup demo user with 200 transactions and 1000 rupees balance"""
    try:
        # Only allow demo user to setup demo data
        if current_user.account_number != DEFAULT_ACCOUNT_NUMBER:
            raise HTTPException(status_code=403, detail="Demo setup only available for demo account")
        result = await setup_demo_user()
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup user: {str(e)}")


# ==================== Expense Endpoints ====================
@app.get("/api/expenses", response_model=List[Expense])
async def get_expenses(current_user: User = Depends(get_current_active_user)):
    """Get all expenses from bank transactions"""
    try:
        transactions = await bank_service.get_transactions(
            current_user.account_number,
            current_user.ifsc_code,
            "alltime"
        )
        
        expenses = []
        expense_categories = {
            (0, 200): ("daily", ["Coffee", "Snacks", "Transport"]),
            (200, 500): ("daily", ["Lunch", "Dinner", "Fuel"]),
            (500, 1500): ("irregular", ["Restaurant", "Entertainment", "Medicine"]),
            (1500, 3000): ("irregular", ["Grocery Shopping", "Clothing"]),
            (3000, 5000): ("regular", ["Electricity Bill", "Internet Bill", "Mobile Recharge"]),
            (5000, float('inf')): ("regular", ["Rent", "Insurance", "EMI"])
        }
        
        for tx in transactions:
            # Only process withdrawals as expenses
            if tx.get('sender_account') == current_user.account_number or \
               tx.get('receiver_account') == 'CASH_WITHDRAWAL':
                amount = float(tx['amount'])
                
                # Categorize based on amount
                category = "daily"
                name = "Expense"
                
                for (min_amt, max_amt), (cat, names) in expense_categories.items():
                    if min_amt <= amount < max_amt:
                        category = cat
                        name = random.choice(names)
                        break
                
                expense = Expense(
                    id=str(tx['id']),
                    name=name,
                    amount=amount,
                    category=category,
                    date=tx['timestamp'][:10]
                )
                expenses.append(expense)
        
        # Sort by date descending
        expenses.sort(key=lambda x: x.date, reverse=True)
        
        # Also include manually added expenses for this user
        user_expense_key = f"{current_user.account_number}_expenses"
        if user_expense_key in expenses_db:
            for exp in expenses_db[user_expense_key].values():
                expenses.append(exp)
        
        return expenses[:50]  # Return last 50 expenses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch expenses: {str(e)}")


@app.post("/api/expenses", response_model=Expense)
async def add_expense(expense: ExpenseCreate, current_user: User = Depends(get_current_active_user)):
    """Add a new expense (creates a withdrawal in bank)"""
    try:
        # Create withdrawal in bank
        await bank_service.withdraw(
            current_user.account_number,
            current_user.ifsc_code,
            expense.amount,
            f"{expense.date} 12:00:00"
        )
        
        # Store in local db with generated ID (per user)
        new_id = str(datetime.now().timestamp())
        new_expense = Expense(
            id=new_id,
            name=expense.name,
            amount=expense.amount,
            category=expense.category,
            date=expense.date
        )
        
        user_expense_key = f"{current_user.account_number}_expenses"
        if user_expense_key not in expenses_db:
            expenses_db[user_expense_key] = {}
        expenses_db[user_expense_key][new_id] = new_expense
        
        return new_expense
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add expense: {str(e)}")


@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: User = Depends(get_current_active_user)):
    """Delete an expense (note: bank transaction cannot be reversed)"""
    user_expense_key = f"{current_user.account_number}_expenses"
    if user_expense_key in expenses_db and expense_id in expenses_db[user_expense_key]:
        del expenses_db[user_expense_key][expense_id]
        return {"message": "Expense deleted successfully"}
    return {"message": "Expense removed from view"}


# ==================== Income Endpoints ====================
@app.post("/api/income")
async def add_income(income: IncomeCreate, current_user: User = Depends(get_current_active_user)):
    """Add income (creates a deposit in bank)"""
    try:
        # Create deposit in bank
        await bank_service.deposit(
            current_user.account_number,
            current_user.ifsc_code,
            income.amount,
            f"{income.date} 12:00:00"
        )
        
        return {
            "message": "Income added successfully",
            "amount": income.amount,
            "description": income.description,
            "date": income.date
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add income: {str(e)}")


# ==================== Budget Endpoints ====================
@app.get("/api/budget")
async def get_budget(current_user: User = Depends(get_current_active_user)):
    """Get budget settings and current spending status"""
    try:
        # Get user balance
        user = await bank_service.get_user(current_user.account_number, current_user.ifsc_code)
        balance = float(user['balance']) if user else 0
        
        # Get expenses for current month
        expenses = await get_expenses(current_user)
        
        # Calculate totals by category (all expenses, not just current month)
        category_totals = {"regular": 0, "irregular": 0, "daily": 0}
        total_spent = 0
        
        for exp in expenses:
            if exp.category in category_totals:
                category_totals[exp.category] += exp.amount
            total_spent += exp.amount
        
        return {
            "monthly_budget": budget_settings.monthly_budget,
            "total_spent": total_spent,
            "remaining": budget_settings.monthly_budget - total_spent,
            "percentage_used": round((total_spent / budget_settings.monthly_budget) * 100, 1) if budget_settings.monthly_budget > 0 else 0,
            "category_totals": category_totals,
            "current_balance": balance,
            "fixed_bills": budget_settings.fixed_bills
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get budget: {str(e)}")


@app.put("/api/budget")
async def update_budget(settings: BudgetSettings, current_user: User = Depends(get_current_active_user)):
    """Update budget settings"""
    global budget_settings
    budget_settings = settings
    return {"message": "Budget settings updated", "settings": settings}


# ==================== Prediction Endpoints ====================
@app.get("/api/predictions")
async def get_predictions(current_user: User = Depends(get_current_active_user)):
    """Get ML-based predictions for income and expenses"""
    try:
        # Get user balance
        user = await bank_service.get_user(current_user.account_number, current_user.ifsc_code)
        balance = float(user['balance']) if user else 0
        
        # Get all transactions
        transactions = await bank_service.get_transactions(
            current_user.account_number,
            current_user.ifsc_code,
            "alltime"
        )
        
        # Calculate days left in month
        today = datetime.now()
        days_in_month = 30
        days_left = days_in_month - today.day + 1
        
        # Get predictions from ML model
        prediction = predictor.get_full_prediction(
            transactions=transactions,
            account_number=current_user.account_number,
            current_balance=balance,
            days_left=days_left,
            fixed_bills_due=budget_settings.fixed_bills
        )
        
        return {
            "predicted_income": prediction['income']['predicted_income'],
            "predicted_expense": prediction['expense']['predicted_expense'],
            "predicted_savings": prediction['summary']['safe_to_spend'],
            "can_spend": prediction['summary']['safe_to_spend'],
            "confidence": prediction['summary']['overall_confidence'],
            "current_balance": balance,
            "days_left": days_left,
            "income_details": prediction['income'],
            "expense_details": prediction['expense'],
            "summary": prediction['summary']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get predictions: {str(e)}")


@app.get("/api/predictions/chart-data")
async def get_chart_data(current_user: User = Depends(get_current_active_user)):
    """Get historical and predicted data for charts"""
    try:
        # Get all transactions
        transactions = await bank_service.get_transactions(
            current_user.account_number,
            current_user.ifsc_code,
            "alltime"
        )
        
        # Process into monthly data
        monthly_data = {}
        
        for tx in transactions:
            date = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00'))
            month_key = date.strftime('%b')
            month_order = date.month
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'income': 0,
                    'expense': 0,
                    'order': month_order
                }
            
            amount = float(tx['amount'])
            
            if tx.get('sender_account') == 'EXTERNAL_DEPOSIT':
                monthly_data[month_key]['income'] += amount
            elif tx.get('sender_account') == current_user.account_number:
                monthly_data[month_key]['expense'] += amount
        
        # Sort by month order and convert to chart format
        sorted_months = sorted(monthly_data.items(), key=lambda x: x[1]['order'])
        
        chart_data = []
        for month, data in sorted_months[-7:]:  # Last 7 months
            chart_data.append({
                'month': month,
                'income': round(data['income'], 2),
                'expense': round(data['expense'], 2),
                'balance': round(data['income'] - data['expense'], 2),
                'isPredicted': False
            })
        
        # Add predictions for next 2 months
        predictions = await get_predictions(current_user)
        
        next_months = ['Feb', 'Mar']
        for i, month in enumerate(next_months):
            multiplier = 1 + (i * 0.05)
            chart_data.append({
                'month': f'{month} (P)',
                'income': round(predictions['predicted_income'] * multiplier, 2),
                'expense': round(predictions['predicted_expense'] * (1 - i * 0.05), 2),
                'balance': round(predictions['predicted_savings'] * (1 + i * 0.15), 2),
                'isPredicted': True
            })
        
        return {"data": chart_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chart data: {str(e)}")


# ==================== Analytics Endpoints ====================
@app.get("/api/analytics/category-summary")
async def get_category_summary(current_user: User = Depends(get_current_active_user)):
    """Get expense summary by category"""
    try:
        expenses = await get_expenses(current_user)
        
        totals = {"regular": 0, "irregular": 0, "daily": 0}
        counts = {"regular": 0, "irregular": 0, "daily": 0}
        
        for exp in expenses:
            if exp.category in totals:
                totals[exp.category] += exp.amount
                counts[exp.category] += 1
        
        return {
            "categories": [
                {
                    "name": "Regular",
                    "id": "regular",
                    "total": round(totals["regular"], 2),
                    "count": counts["regular"],
                    "description": "Bills & subscriptions"
                },
                {
                    "name": "Irregular",
                    "id": "irregular",
                    "total": round(totals["irregular"], 2),
                    "count": counts["irregular"],
                    "description": "Shopping & occasions"
                },
                {
                    "name": "Daily",
                    "id": "daily",
                    "total": round(totals["daily"], 2),
                    "count": counts["daily"],
                    "description": "Food & transport"
                }
            ],
            "total": round(sum(totals.values()), 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get category summary: {str(e)}")


@app.get("/api/analytics/weekly-spending")
async def get_weekly_spending(current_user: User = Depends(get_current_active_user)):
    """Get weekly spending breakdown for charts"""
    try:
        expenses = await get_expenses(current_user)
        
        # Group by day of week
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily_data = {day: {"regular": 0, "irregular": 0, "daily": 0} for day in days}
        
        for exp in expenses:
            try:
                date = datetime.strptime(exp.date, '%Y-%m-%d')
                day_name = days[date.weekday()]
                if exp.category in daily_data[day_name]:
                    daily_data[day_name][exp.category] += exp.amount
            except:
                continue
        
        result = []
        for day in days:
            result.append({
                "day": day,
                "regular": round(daily_data[day]["regular"], 2),
                "irregular": round(daily_data[day]["irregular"], 2),
                "daily": round(daily_data[day]["daily"], 2)
            })
        
        return {"data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weekly spending: {str(e)}")


@app.get("/api/transactions")
async def get_transactions(current_user: User = Depends(get_current_active_user)):
    """Get raw transactions from bank"""
    try:
        transactions = await bank_service.get_transactions(
            current_user.account_number,
            current_user.ifsc_code,
            "alltime"
        )
        return {"transactions": transactions, "count": len(transactions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
