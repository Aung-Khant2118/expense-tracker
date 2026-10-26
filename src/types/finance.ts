/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Mobile Wallet'
  | 'Credit Card'
  | 'Debit Card'
  | 'Other';

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  transactionDate: string; // YYYY-MM-DD
  description?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  currency: string;
  currencyPosition: 'prefix' | 'suffix';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  theme: 'light' | 'dark';
}

export interface HighestSpendingCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export interface PreviousMonthComparison {
  previousIncome: number;
  previousExpenses: number;
  previousBalance: number;
  incomeChangeAmount: number;
  incomeChangePercent: number | null;
  expenseChangeAmount: number;
  expenseChangePercent: number | null;
  balanceChangeAmount: number;
}

export interface MonthlySummary {
  year: number;
  month: number; // 1-12
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
  moneyLeft: number;
  isDeficit: boolean;
  expensePercentage: number | null;
  dailyAverageExpense: number;
  daysElapsedInMonth: number;
  totalDaysInMonth: number;
  isCurrentMonth: boolean;
  highestSpendingCategory: HighestSpendingCategory | null;
  previousMonthComparison: PreviousMonthComparison | null;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  income: number;
  expense: number;
  net: number;
  cumulativeExpense: number;
  transactionCount: number;
}
