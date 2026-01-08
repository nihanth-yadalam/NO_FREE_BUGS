"""
VaultGuard Backend - Main FastAPI Application
Connects frontend with bank-api and provides ML predictions
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

from ml_models import VaultGuardPredictor, categorize_expense

load_dotenv()

app = FastAPI(
    title="VaultGuard Backend",
    description="Financial Goal Management API for Freelancers",
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

# Configuration
BANK_API_URL = os.getenv("BANK_API_URL", "http://bank-service:3100")
USER_ACCOUNT = os.getenv("USER_ACCOUNT", "VG12345678")
USER_IFSC = os.getenv("USER_IFSC", "VAULT0001")
USER_NAME = os.getenv("USER_NAME", "Rahul Sharma")
USER_EMAIL = os.getenv("USER_EMAIL", "rahul.sharma@email.com")

# Initialize predictor
predictor = VaultGuardPredictor()


# Pydantic Models
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
    category: str  # regular, irregular, daily
    date: str
    transaction_id: Optional[str] = None


class AddExpenseRequest(BaseModel):
    name: str
    amount: float
    category: str
    date: Optional[str] = None


class PredictionResponse(BaseModel):
    predictedIncome: float
    predictedExpense: float
    predictedSavings: float
    canSpend: float
    confidence: float
    incomeDetails: Dict[str, Any]
    expenseDetails: Dict[str, Any]


class DashboardData(BaseModel):
    user: UserProfile
    budget: float
    totalSpent: float
    expenses: List[Expense]
    categorySummary: Dict[str, float]


# Helper functions
async def get_bank_user():
    """Fetch user details from bank API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BANK_API_URL}/getuser/{USER_ACCOUNT}/{USER_IFSC}")
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None


async def get_bank_transactions():
    """Fetch all transactions from bank API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BANK_API_URL}/gettransaction/{USER_ACCOUNT}/{USER_IFSC}/alltime"
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            return []
        except Exception as e:
            print(f"Error fetching transactions: {e}")
            return []


async def create_bank_user(initial_balance: float = 0):
    """Create a new user in bank API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BANK_API_URL}/adduser/{USER_ACCOUNT}/{USER_IFSC}",
                json={"initial_balance": initial_balance}
            )
            return response.status_code == 201
        except Exception as e:
            print(f"Error creating user: {e}")
            return False


async def make_deposit(amount: float):
    """Make a deposit to user's account"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BANK_API_URL}/deposit/{USER_ACCOUNT}/{USER_IFSC}/{amount}"
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error making deposit: {e}")
            return False


async def make_withdrawal(amount: float):
    """Make a withdrawal from user's account"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BANK_API_URL}/withdraw/{USER_ACCOUNT}/{USER_IFSC}/{amount}"
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error making withdrawal: {e}")
            return False


# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "UP", "message": "VaultGuard Backend is operational"}


@app.get("/api/user", response_model=UserProfile)
async def get_user_profile():
    """Get current user profile with bank details"""
    bank_user = await get_bank_user()
    
    if not bank_user:
        raise HTTPException(status_code=404, detail="User not found in bank")
    
    return UserProfile(
        name=USER_NAME,
        email=USER_EMAIL,
        bankName="VaultGuard Bank",
        accountNumber=f"XXXX XXXX {USER_ACCOUNT[-4:]}",
        ifscCode=USER_IFSC,
        balance=float(bank_user.get('balance', 0))
    )


@app.get("/api/balance")
async def get_balance():
    """Get current account balance"""
    bank_user = await get_bank_user()
    
    if not bank_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"balance": float(bank_user.get('balance', 0))}


@app.get("/api/transactions")
async def get_transactions():
    """Get all transactions"""
    transactions = await get_bank_transactions()
    return {"transactions": transactions, "count": len(transactions)}


@app.get("/api/expenses", response_model=List[Expense])
async def get_expenses():
    """Get expenses (withdrawals and payments) as categorized expenses"""
    transactions = await get_bank_transactions()
    
    expenses = []
    for txn in transactions:
        # Only include expenses (where user is sender)
        if txn.get('sender_account') == USER_ACCOUNT:
            receiver = txn.get('receiver_account', 'Unknown')
            amount = float(txn.get('amount', 0))
            timestamp = txn.get('timestamp', '')
            
            # Generate expense name based on receiver
            if receiver == 'CASH_WITHDRAWAL':
                name = 'Cash Withdrawal'
            else:
                name = f"Payment to {receiver[:10]}..."
            
            # Categorize the expense
            category = categorize_expense(name, amount)
            
            expenses.append(Expense(
                id=str(txn.get('id', '')),
                name=name,
                amount=amount,
                category=category,
                date=timestamp[:10] if timestamp else datetime.now().strftime('%Y-%m-%d'),
                transaction_id=str(txn.get('id', ''))
            ))
    
    # Sort by date descending
    expenses.sort(key=lambda x: x.date, reverse=True)
    return expenses


@app.post("/api/expenses")
async def add_expense(expense: AddExpenseRequest):
    """Add a new expense (creates a withdrawal transaction)"""
    # Make withdrawal from bank
    success = await make_withdrawal(expense.amount)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to process expense")
    
    return {"message": "Expense added successfully", "amount": expense.amount}


@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get complete dashboard data"""
    bank_user = await get_bank_user()
    transactions = await get_bank_transactions()
    
    if not bank_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    balance = float(bank_user.get('balance', 0))
    
    # Process expenses
    expenses = []
    category_totals = {'regular': 0, 'irregular': 0, 'daily': 0}
    
    for txn in transactions:
        if txn.get('sender_account') == USER_ACCOUNT:
            receiver = txn.get('receiver_account', 'Unknown')
            amount = float(txn.get('amount', 0))
            timestamp = txn.get('timestamp', '')
            
            if receiver == 'CASH_WITHDRAWAL':
                name = 'Cash Withdrawal'
            else:
                name = f"Payment - {receiver[:15]}"
            
            category = categorize_expense(name, amount)
            category_totals[category] += amount
            
            expenses.append({
                'id': str(txn.get('id', '')),
                'name': name,
                'amount': amount,
                'category': category,
                'date': timestamp[:10] if timestamp else datetime.now().strftime('%Y-%m-%d')
            })
    
    # Sort expenses by date
    expenses.sort(key=lambda x: x['date'], reverse=True)
    
    # Calculate monthly budget (estimate based on income patterns)
    total_income = sum(
        float(txn.get('amount', 0)) 
        for txn in transactions 
        if txn.get('receiver_account') == USER_ACCOUNT
    )
    total_expense = sum(category_totals.values())
    
    # Estimate monthly budget as 80% of average monthly income
    months_of_data = max(1, len(set(t.get('timestamp', '')[:7] for t in transactions)))
    monthly_budget = (total_income / months_of_data) * 0.8 if total_income > 0 else 50000
    
    return {
        'user': {
            'name': USER_NAME,
            'email': USER_EMAIL,
            'bankName': 'VaultGuard Bank',
            'accountNumber': f"XXXX XXXX {USER_ACCOUNT[-4:]}",
            'ifscCode': USER_IFSC,
            'balance': balance
        },
        'budget': round(monthly_budget, 2),
        'totalSpent': round(total_expense, 2),
        'expenses': expenses[:20],  # Last 20 expenses
        'categorySummary': category_totals
    }


@app.get("/api/predictions")
async def get_predictions(days_left: int = 15, fixed_bills: float = 0):
    """Get ML-based financial predictions"""
    bank_user = await get_bank_user()
    transactions = await get_bank_transactions()
    
    if not bank_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    balance = float(bank_user.get('balance', 0))
    
    # Get full prediction
    prediction = predictor.get_full_prediction(
        transactions=transactions,
        user_account=USER_ACCOUNT,
        current_balance=balance,
        fixed_bills=fixed_bills,
        days_left=days_left
    )
    
    return prediction


@app.get("/api/analytics/history")
async def get_historical_data(months: int = 6):
    """Get historical monthly data for charts"""
    transactions = await get_bank_transactions()
    
    history = predictor.get_historical_summary(
        transactions=transactions,
        user_account=USER_ACCOUNT,
        months=months
    )
    
    return {"history": history}


@app.get("/api/analytics/category-breakdown")
async def get_category_breakdown():
    """Get expense breakdown by category"""
    transactions = await get_bank_transactions()
    
    category_totals = {'regular': 0, 'irregular': 0, 'daily': 0}
    category_counts = {'regular': 0, 'irregular': 0, 'daily': 0}
    
    for txn in transactions:
        if txn.get('sender_account') == USER_ACCOUNT:
            receiver = txn.get('receiver_account', 'Unknown')
            amount = float(txn.get('amount', 0))
            
            if receiver == 'CASH_WITHDRAWAL':
                name = 'Cash Withdrawal'
            else:
                name = f"Payment - {receiver}"
            
            category = categorize_expense(name, amount)
            category_totals[category] += amount
            category_counts[category] += 1
    
    return {
        'totals': category_totals,
        'counts': category_counts,
        'total_spent': sum(category_totals.values())
    }


@app.get("/api/analytics/weekly")
async def get_weekly_spending():
    """Get weekly spending pattern"""
    transactions = await get_bank_transactions()
    
    # Initialize daily totals
    daily_totals = {i: {'regular': 0, 'irregular': 0, 'daily': 0} for i in range(7)}
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for txn in transactions:
        if txn.get('sender_account') == USER_ACCOUNT:
            timestamp = txn.get('timestamp', '')
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    day_of_week = dt.weekday()
                    amount = float(txn.get('amount', 0))
                    receiver = txn.get('receiver_account', '')
                    
                    if receiver == 'CASH_WITHDRAWAL':
                        name = 'Cash Withdrawal'
                    else:
                        name = f"Payment - {receiver}"
                    
                    category = categorize_expense(name, amount)
                    daily_totals[day_of_week][category] += amount
                except:
                    pass
    
    result = []
    for i in range(7):
        result.append({
            'day': day_names[i],
            'regular': round(daily_totals[i]['regular'], 2),
            'irregular': round(daily_totals[i]['irregular'], 2),
            'daily': round(daily_totals[i]['daily'], 2)
        })
    
    return {'weekly': result}


# Initialization endpoints (for setup)
@app.delete("/api/setup/clear-data")
async def setup_clear_data():
    """Delete the user account and all transactions to start fresh"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{BANK_API_URL}/deleteuser/{USER_ACCOUNT}/{USER_IFSC}")
            if response.status_code == 200:
                return {"message": "User and transactions cleared successfully"}
            else:
                return {"message": "User may not exist or already cleared", "status": response.status_code}
        except Exception as e:
            return {"message": f"Error clearing data: {str(e)}"}

@app.post("/api/setup/create-user")
async def setup_create_user():
    """Create the VaultGuard user in bank"""
    # First check if user exists
    existing = await get_bank_user()
    if existing:
        return {"message": "User already exists", "user": existing}
    
    # Create user
    success = await create_bank_user(initial_balance=0)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    return {"message": "User created successfully"}


@app.post("/api/setup/seed-transactions")
async def setup_seed_transactions(num_transactions: int = 200, target_balance: float = 1000):
    """
    Seed dummy transactions - simple and realistic for a freelancer
    All transactions are small (max ₹2000), no outliers
    """
    # Ensure user exists
    existing = await get_bank_user()
    if not existing:
        await create_bank_user(initial_balance=0)
    
    end_date = datetime.now()
    
    # Simple expense categories with small amounts (all under ₹2000)
    expenses = [
        ('Coffee', 'daily', 30, 80),
        ('Tea', 'daily', 10, 30),
        ('Lunch', 'daily', 60, 150),
        ('Dinner', 'daily', 80, 200),
        ('Snacks', 'daily', 20, 60),
        ('Auto', 'daily', 25, 80),
        ('Metro', 'daily', 20, 50),
        ('Uber', 'daily', 80, 200),
        ('Grocery', 'irregular', 300, 800),
        ('Amazon', 'irregular', 150, 600),
        ('Movie', 'irregular', 150, 350),
        ('Restaurant', 'irregular', 200, 500),
        ('Medicine', 'irregular', 50, 300),
        ('Haircut', 'irregular', 100, 200),
        ('Phone Bill', 'regular', 199, 399),
        ('Internet', 'regular', 500, 800),
        ('Netflix', 'regular', 149, 199),
        ('Electricity', 'regular', 400, 900),
    ]
    
    # Simple income sources (small freelance payments)
    incomes = [
        ('Small Task', 300, 800),
        ('Article', 500, 1200),
        ('Design Work', 800, 1800),
        ('Gig Payment', 200, 600),
        ('Survey Reward', 50, 150),
        ('Client Payment', 1000, 2000),
    ]
    
    # Create 80 income + 120 expense = 200 transactions
    num_income = 80
    num_expense = 120
    
    all_txns = []
    
    # Generate income transactions spread over 180 days
    for i in range(num_income):
        inc = random.choice(incomes)
        amount = random.randint(inc[1], inc[2])
        days_ago = random.randint(1, 180)
        ts = (end_date - timedelta(days=days_ago, hours=random.randint(8, 20))).isoformat()
        all_txns.append(('income', amount, ts))
    
    # Generate expense transactions
    for i in range(num_expense):
        exp = random.choice(expenses)
        amount = random.randint(exp[2], exp[3])
        days_ago = random.randint(1, 180)
        ts = (end_date - timedelta(days=days_ago, hours=random.randint(8, 20))).isoformat()
        all_txns.append(('expense', amount, ts, exp[1]))  # include category type
    
    # Sort by timestamp
    all_txns.sort(key=lambda x: x[2])
    
    # Calculate totals
    total_income = sum(t[1] for t in all_txns if t[0] == 'income')
    total_expense = sum(t[1] for t in all_txns if t[0] == 'expense')
    
    # Simulate running balance to find minimum buffer needed
    running = 0
    min_balance = 0
    for txn in all_txns:
        if txn[0] == 'income':
            running += txn[1]
        else:
            running -= txn[1]
        if running < min_balance:
            min_balance = running
    
    # Final balance after all transactions = buffer + total_income - total_expense
    # We want this = target_balance
    # So buffer = target_balance - total_income + total_expense
    # But we also need buffer >= abs(min_balance) to avoid going negative
    calculated_buffer = target_balance - total_income + total_expense
    min_required_buffer = abs(min_balance) if min_balance < 0 else 0
    buffer_needed = max(calculated_buffer, min_required_buffer)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        count = 0
        deposited = 0
        withdrawn = 0
        
        # Initial deposit - buffer to cover all expenses + target balance
        first_ts = (end_date - timedelta(days=181)).isoformat()
        try:
            r = await client.post(
                f"{BANK_API_URL}/deposit/{USER_ACCOUNT}/{USER_IFSC}/{int(buffer_needed)}",
                json={"timestamp": first_ts}
            )
            if r.status_code == 200:
                deposited += buffer_needed
                count += 1
        except:
            pass
        
        # Process all 200 transactions
        for txn in all_txns:
            try:
                if txn[0] == 'income':
                    r = await client.post(
                        f"{BANK_API_URL}/deposit/{USER_ACCOUNT}/{USER_IFSC}/{txn[1]}",
                        json={"timestamp": txn[2]}
                    )
                    if r.status_code == 200:
                        deposited += txn[1]
                        count += 1
                else:
                    r = await client.post(
                        f"{BANK_API_URL}/withdraw/{USER_ACCOUNT}/{USER_IFSC}/{txn[1]}",
                        json={"timestamp": txn[2]}
                    )
                    if r.status_code == 200:
                        withdrawn += txn[1]
                        count += 1
            except:
                pass
    
    # Get final balance
    user = await get_bank_user()
    final = float(user.get('balance', 0)) if user else 0
    
    return {
        "message": f"Seeded {count} transactions",
        "total_deposited": round(deposited, 2),
        "total_withdrawn": round(withdrawn, 2),
        "final_balance": final,
        "target_balance": target_balance
    }


@app.post("/api/setup/full-setup")
async def full_setup():
    """
    Complete setup: Create user and seed 200 transactions
    Final balance will be 1000 rupees
    """
    # Step 1: Create user
    await setup_create_user()
    
    # Step 2: Seed transactions
    result = await setup_seed_transactions(num_transactions=200, target_balance=1000)
    
    return {
        "message": "Full setup complete",
        "details": result
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
