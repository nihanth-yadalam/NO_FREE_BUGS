# VaultGuard Backend

Financial Goal Management API for Freelancers - provides ML-powered predictions and integrates with the bank-api.

## Features

- **User Management**: Fetch user profile and balance from bank-api
- **Transaction Analysis**: Categorizes expenses as regular, irregular, or daily
- **ML Predictions**: Uses Random Forest and statistical models for income/expense forecasting
- **Historical Analytics**: Monthly and weekly spending breakdowns
- **Cold-Start Handling**: Hybrid approach that works with limited historical data

## API Endpoints

### Health Check
- `GET /health` - Service health status

### User
- `GET /api/user` - Get user profile with bank details
- `GET /api/balance` - Get current account balance

### Dashboard
- `GET /api/dashboard` - Complete dashboard data (user, budget, expenses, categories)

### Expenses
- `GET /api/expenses` - List all expenses (categorized)
- `POST /api/expenses` - Add new expense (creates withdrawal)

### Predictions (ML-Powered)
- `GET /api/predictions?days_left=15&fixed_bills=0` - Get income/expense predictions

### Analytics
- `GET /api/analytics/history?months=6` - Monthly income/expense history
- `GET /api/analytics/category-breakdown` - Expense breakdown by category
- `GET /api/analytics/weekly` - Weekly spending patterns

### Setup (Data Seeding)
- `POST /api/setup/create-user` - Create VaultGuard user in bank
- `POST /api/setup/seed-transactions?num_transactions=200&target_balance=1000` - Seed dummy transactions
- `POST /api/setup/full-setup` - Complete setup (user + 200 transactions)

## ML Model Details

The prediction system uses a hybrid approach:

### Income Prediction (Model A)
- Uses Random Forest Regressor
- Features: day of week, weekend flag, lag-1 income, 7-day rolling average
- Cold-start logic: Falls back to statistical average when < 30 days of data
- Safety factor based on income volatility (0.70 - 0.95)

### Expense Forecasting (Model B)
- Weighted weekly average (recent weeks weighted higher)
- Safety buffer of 10% to overestimate expenses
- Falls back to simple average when data is limited

### Hybrid Strategy
- < 30 days history: 100% statistical model
- 30-90 days history: 70% ML + 30% statistical
- > 90 days history: 90% ML + 10% statistical

## Environment Variables

```
BANK_API_URL=http://bank-service:3100
USER_ACCOUNT=VG12345678
USER_IFSC=VAULT0001
USER_NAME=Rahul Sharma
USER_EMAIL=rahul.sharma@email.com
```

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

## Docker

The service is configured to run as part of the docker-compose setup. It automatically:
1. Connects to bank-service
2. Provides CORS support for frontend
3. Mounts source code for hot-reloading

## Dependencies

- FastAPI - Web framework
- uvicorn - ASGI server
- httpx - Async HTTP client
- pandas - Data manipulation
- numpy - Numerical computing
- scikit-learn - ML models
- pydantic - Data validation
