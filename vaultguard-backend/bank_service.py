"""
Bank API Service - Handles communication with the simulated bank API
"""
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random
from config import BANK_API_URL, DEFAULT_ACCOUNT_NUMBER, DEFAULT_IFSC_CODE


class BankAPIService:
    """Service for interacting with the Bank API"""
    
    def __init__(self, base_url: str = BANK_API_URL):
        self.base_url = base_url
        self.timeout = httpx.Timeout(30.0)
    
    async def health_check(self) -> Dict:
        """Check if Bank API is healthy"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/health")
            return response.json()
    
    async def get_all_users(self) -> Dict:
        """Get all users from the bank"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/getallusers")
            return response.json()
    
    async def get_user(self, account_number: str, ifsc_code: str) -> Optional[Dict]:
        """Get specific user details"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/getuser/{account_number}/{ifsc_code}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
    
    async def account_exists(self, account_number: str, ifsc_code: str = "VAULT001") -> bool:
        """Check if an account number already exists in the bank"""
        user = await self.get_user(account_number, ifsc_code)
        return user is not None
    
    async def create_user(self, account_number: str, ifsc_code: str, initial_balance: float = 0) -> Dict:
        """Create a new user"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/adduser/{account_number}/{ifsc_code}",
                json={"initial_balance": initial_balance}
            )
            # Don't raise for status - handle 400 (user exists) gracefully
            if response.status_code == 400:
                return {"message": "User may already exist", "status": "exists"}
            response.raise_for_status()
            return response.json()
    
    async def delete_user(self, account_number: str, ifsc_code: str) -> Dict:
        """Delete a user"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(f"{self.base_url}/deleteuser/{account_number}/{ifsc_code}")
            return response.json()
    
    async def get_transactions(
        self,
        account_number: str,
        ifsc_code: str,
        filter_type: str = "alltime",
        filter_value: Optional[str] = None
    ) -> List[Dict]:
        """Get transactions for a user"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}/gettransaction/{account_number}/{ifsc_code}/{filter_type}"
            params = {"value": filter_value} if filter_value else {}
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
    
    async def deposit(
        self,
        account_number: str,
        ifsc_code: str,
        amount: float,
        timestamp: Optional[str] = None
    ) -> Dict:
        """Make a deposit"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            json_data = {"timestamp": timestamp} if timestamp else {}
            response = await client.post(
                f"{self.base_url}/deposit/{account_number}/{ifsc_code}/{amount}",
                json=json_data
            )
            response.raise_for_status()
            return response.json()
    
    async def withdraw(
        self,
        account_number: str,
        ifsc_code: str,
        amount: float,
        timestamp: Optional[str] = None
    ) -> Dict:
        """Make a withdrawal"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            json_data = {"timestamp": timestamp} if timestamp else {}
            response = await client.post(
                f"{self.base_url}/withdraw/{account_number}/{ifsc_code}/{amount}",
                json=json_data
            )
            response.raise_for_status()
            return response.json()


async def setup_demo_user() -> Dict:
    """
    Create a demo user with 200 transactions and ending balance of 1000 rupees
    """
    service = BankAPIService()
    account = DEFAULT_ACCOUNT_NUMBER
    ifsc = DEFAULT_IFSC_CODE
    
    # Check if user exists and delete if so
    try:
        existing_user = await service.get_user(account, ifsc)
        if existing_user:
            await service.delete_user(account, ifsc)
            # Wait a bit for the delete to complete
            import asyncio
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"Error checking/deleting existing user: {e}")
    
    # Create new user with 0 balance
    try:
        await service.create_user(account, ifsc, 0)
    except Exception as e:
        print(f"Error creating user (may already exist): {e}")
    
    # Generate 200 transactions over the past 6 months
    transactions_created = 0
    total_deposited = 0
    total_withdrawn = 0
    
    # Categories for expenses (for reference in frontend)
    expense_categories = [
        ("Electricity Bill", "regular", 2000, 3500),
        ("Water Bill", "regular", 300, 600),
        ("Internet Bill", "regular", 800, 1200),
        ("Mobile Recharge", "regular", 500, 800),
        ("Grocery Shopping", "irregular", 1500, 4000),
        ("Restaurant", "daily", 200, 800),
        ("Coffee", "daily", 50, 200),
        ("Transport", "daily", 100, 400),
        ("Fuel", "irregular", 1000, 2500),
        ("Medicine", "irregular", 200, 1500),
        ("Clothing", "irregular", 1000, 5000),
        ("Entertainment", "irregular", 300, 1500),
        ("Snacks", "daily", 30, 150),
        ("Lunch", "daily", 100, 300),
        ("Dinner", "daily", 150, 400),
    ]
    
    # Income sources for freelancers
    income_sources = [
        ("Freelance Project", 5000, 25000),
        ("Client Payment", 3000, 15000),
        ("Gig Work", 1000, 8000),
        ("Consultation Fee", 2000, 10000),
        ("Part-time Work", 3000, 12000),
    ]
    
    # Generate dates for the past 6 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    # Generate income transactions (about 60 transactions)
    income_transactions = []
    current_date = start_date
    
    while len(income_transactions) < 60:
        # Freelancers get income sporadically
        if random.random() < 0.35:  # 35% chance of income on any day
            source = random.choice(income_sources)
            amount = random.randint(source[1], source[2])
            income_transactions.append({
                'date': current_date.strftime('%Y-%m-%d %H:%M:%S'),
                'amount': amount,
                'type': 'deposit'
            })
            total_deposited += amount
        
        current_date += timedelta(days=1)
        if current_date > end_date:
            current_date = start_date + timedelta(days=random.randint(1, 30))
    
    # Generate expense transactions (about 140 transactions)
    expense_transactions = []
    current_date = start_date
    
    while len(expense_transactions) < 140:
        # Daily expenses happen more frequently
        num_expenses_today = random.choices([0, 1, 2, 3], weights=[0.1, 0.3, 0.4, 0.2])[0]
        
        for _ in range(num_expenses_today):
            category = random.choice(expense_categories)
            amount = random.randint(category[2], category[3])
            expense_transactions.append({
                'date': current_date.strftime('%Y-%m-%d %H:%M:%S'),
                'amount': amount,
                'type': 'withdraw',
                'name': category[0],
                'category': category[1]
            })
            total_withdrawn += amount
        
        current_date += timedelta(days=1)
        if current_date > end_date:
            break
    
    # Ensure we have exactly 200 transactions total
    all_transactions = income_transactions[:60] + expense_transactions[:140]
    
    # Adjust amounts to ensure final balance is 1000
    target_balance = 1000
    current_diff = total_deposited - total_withdrawn
    
    # Add a final adjustment transaction
    if current_diff < target_balance:
        # Need more deposits
        adjustment = target_balance - current_diff + 5000  # Add buffer for pending expenses
        income_transactions.append({
            'date': end_date.strftime('%Y-%m-%d %H:%M:%S'),
            'amount': adjustment,
            'type': 'deposit'
        })
        total_deposited += adjustment
    
    # Sort all transactions by date
    all_transactions = income_transactions + expense_transactions
    all_transactions.sort(key=lambda x: x['date'])
    
    # Execute transactions in order
    running_balance = 0
    
    for tx in all_transactions[:200]:  # Limit to 200 transactions
        try:
            if tx['type'] == 'deposit':
                await service.deposit(account, ifsc, tx['amount'], tx['date'])
                running_balance += tx['amount']
                transactions_created += 1
            else:
                # Only withdraw if we have enough balance
                if running_balance >= tx['amount']:
                    await service.withdraw(account, ifsc, tx['amount'], tx['date'])
                    running_balance -= tx['amount']
                    transactions_created += 1
        except Exception as e:
            print(f"Transaction error: {e}")
            continue
    
    # Final balance adjustment to reach exactly 1000
    final_user = await service.get_user(account, ifsc)
    current_balance = float(final_user['balance'])
    
    if current_balance > 1000:
        # Withdraw excess
        excess = current_balance - 1000
        if excess > 0:
            await service.withdraw(account, ifsc, excess)
    elif current_balance < 1000:
        # Deposit difference
        deficit = 1000 - current_balance
        await service.deposit(account, ifsc, deficit)
    
    # Get final user details
    final_user = await service.get_user(account, ifsc)
    
    return {
        'account_number': account,
        'ifsc_code': ifsc,
        'transactions_created': transactions_created,
        'final_balance': float(final_user['balance']),
        'message': 'Demo user created successfully'
    }
