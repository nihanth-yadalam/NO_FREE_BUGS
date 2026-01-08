/**
 * VaultGuard API Service
 * Handles all communication with the vaultguard-backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Types
export interface UserProfile {
  name: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  balance: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'regular' | 'irregular' | 'daily';
  date: string;
  transaction_id?: string;
}

export interface DashboardData {
  user: UserProfile;
  budget: number;
  totalSpent: number;
  expenses: Expense[];
  categorySummary: {
    regular: number;
    irregular: number;
    daily: number;
  };
}

export interface PredictionData {
  current_balance: number;
  income_prediction: {
    predicted_income: number;
    raw_prediction: number;
    ml_prediction: number;
    statistical_prediction: number;
    daily_average: number;
    confidence: number;
    method: string;
    safety_factor: number;
    days_history: number;
    volatility: number;
  };
  expense_prediction: {
    predicted_expenses: number;
    daily_run_rate: number;
    confidence: number;
    method: string;
    days_analyzed: number;
    safety_buffer: number;
  };
  fixed_bills: number;
  total_liquidity: number;
  total_obligations: number;
  safe_to_spend: number;
  is_safe: boolean;
  deficit: number;
  overall_confidence: number;
  days_forecast: number;
  analysis: {
    income_transactions_count: number;
    expense_transactions_count: number;
    total_transactions: number;
  };
}

export interface HistoricalMonth {
  month: string;
  month_label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface WeeklyData {
  day: string;
  regular: number;
  irregular: number;
  daily: number;
}

export interface CategoryBreakdown {
  totals: {
    regular: number;
    irregular: number;
    daily: number;
  };
  counts: {
    regular: number;
    irregular: number;
    daily: number;
  };
  total_spent: number;
}

// API Functions
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Health check
export async function checkHealth(): Promise<{ status: string; message: string }> {
  return fetchAPI('/health');
}

// User endpoints
export async function getUserProfile(): Promise<UserProfile> {
  return fetchAPI('/api/user');
}

export async function getBalance(): Promise<{ balance: number }> {
  return fetchAPI('/api/balance');
}

// Dashboard
export async function getDashboardData(): Promise<DashboardData> {
  return fetchAPI('/api/dashboard');
}

// Expenses
export async function getExpenses(): Promise<Expense[]> {
  return fetchAPI('/api/expenses');
}

export async function addExpense(expense: {
  name: string;
  amount: number;
  category: string;
  date?: string;
}): Promise<{ message: string; amount: number }> {
  return fetchAPI('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

// Predictions
export async function getPredictions(
  daysLeft: number = 15,
  fixedBills: number = 0
): Promise<PredictionData> {
  return fetchAPI(`/api/predictions?days_left=${daysLeft}&fixed_bills=${fixedBills}`);
}

// Analytics
export async function getHistoricalData(months: number = 6): Promise<{ history: HistoricalMonth[] }> {
  return fetchAPI(`/api/analytics/history?months=${months}`);
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown> {
  return fetchAPI('/api/analytics/category-breakdown');
}

export async function getWeeklySpending(): Promise<{ weekly: WeeklyData[] }> {
  return fetchAPI('/api/analytics/weekly');
}

// Setup endpoints (for initial data seeding)
export async function setupFullSetup(): Promise<{ message: string; details: any }> {
  return fetchAPI('/api/setup/full-setup', { method: 'POST' });
}

export async function setupCreateUser(): Promise<{ message: string; user?: any }> {
  return fetchAPI('/api/setup/create-user', { method: 'POST' });
}

export async function setupSeedTransactions(
  numTransactions: number = 200,
  targetBalance: number = 1000
): Promise<any> {
  return fetchAPI(
    `/api/setup/seed-transactions?num_transactions=${numTransactions}&target_balance=${targetBalance}`,
    { method: 'POST' }
  );
}

// Transactions
export async function getTransactions(): Promise<{ transactions: any[]; count: number }> {
  return fetchAPI('/api/transactions');
}

export default {
  checkHealth,
  getUserProfile,
  getBalance,
  getDashboardData,
  getExpenses,
  addExpense,
  getPredictions,
  getHistoricalData,
  getCategoryBreakdown,
  getWeeklySpending,
  setupFullSetup,
  setupCreateUser,
  setupSeedTransactions,
  getTransactions,
};
