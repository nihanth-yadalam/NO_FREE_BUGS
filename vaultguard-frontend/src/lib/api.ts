/**
 * VaultGuard API Service
 * Handles all API calls to the VaultGuard backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('vaultguard_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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
  category: "regular" | "irregular" | "daily";
  date: string;
}

export interface ExpenseCreate {
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

export interface BudgetData {
  monthly_budget: number;
  total_spent: number;
  remaining: number;
  percentage_used: number;
  category_totals: {
    regular: number;
    irregular: number;
    daily: number;
  };
  current_balance: number;
  fixed_bills: number;
}

export interface PredictionData {
  predicted_income: number;
  predicted_expense: number;
  predicted_savings: number;
  can_spend: number;
  confidence: number;
  current_balance: number;
  days_left: number;
  income_details: {
    predicted_income: number;
    daily_average: number;
    confidence: number;
    method: string;
    days_history: number;
  };
  expense_details: {
    predicted_expense: number;
    daily_run_rate: number;
    confidence: number;
    method: string;
  };
  summary: {
    current_balance: number;
    predicted_income: number;
    predicted_expense: number;
    fixed_bills_due: number;
    total_liquidity: number;
    total_obligations: number;
    safe_to_spend: number;
    days_left: number;
    overall_confidence: number;
    is_safe: boolean;
  };
}

export interface ChartDataPoint {
  month: string;
  income: number;
  expense: number;
  balance: number;
  isPredicted?: boolean;
}

export interface CategorySummary {
  categories: {
    name: string;
    id: string;
    total: number;
    count: number;
    description: string;
  }[];
  total: number;
}

export interface WeeklySpendingData {
  day: string;
  regular: number;
  irregular: number;
  daily: number;
}

// API Functions

/**
 * Fetch user profile including bank balance
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}

/**
 * Setup demo user with transactions
 */
export async function setupDemoUser(): Promise<{ message: string; final_balance: number }> {
  const response = await fetch(`${API_BASE_URL}/api/user/setup`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to setup demo user');
  }
  return response.json();
}

/**
 * Fetch all expenses
 */
export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/api/expenses`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }
  return response.json();
}

/**
 * Add a new expense
 */
export async function addExpense(expense: ExpenseCreate): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(expense),
  });
  if (!response.ok) {
    throw new Error('Failed to add expense');
  }
  return response.json();
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete expense');
  }
}

/**
 * Fetch budget data
 */
export async function getBudget(): Promise<BudgetData> {
  const response = await fetch(`${API_BASE_URL}/api/budget`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  return response.json();
}

/**
 * Update budget settings
 */
export async function updateBudget(settings: {
  monthly_budget: number;
  fixed_bills: number;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/budget`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to update budget');
  }
}

/**
 * Fetch ML predictions
 */
export async function getPredictions(): Promise<PredictionData> {
  const response = await fetch(`${API_BASE_URL}/api/predictions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch predictions');
  }
  return response.json();
}

/**
 * Fetch chart data for predictions
 */
export async function getChartData(): Promise<ChartDataPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/predictions/chart-data`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch chart data');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Fetch category summary
 */
export async function getCategorySummary(): Promise<CategorySummary> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/category-summary`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch category summary');
  }
  return response.json();
}

/**
 * Fetch weekly spending data
 */
export async function getWeeklySpending(): Promise<WeeklySpendingData[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/weekly-spending`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch weekly spending');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('API is not healthy');
  }
  return response.json();
}
