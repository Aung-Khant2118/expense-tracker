/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Transaction,
  Category,
  MonthlySummary,
  CategoryBreakdownItem,
  DailyActivity,
  HighestSpendingCategory,
  PreviousMonthComparison,
} from '../types/finance.ts';

/**
 * Currency configuration with symbols and default fraction digits
 */
export const CURRENCIES: Record<string, { name: string; symbol: string; decimals: number; defaultPosition: 'prefix' | 'suffix' }> = {
  MMK: { name: 'Myanmar Kyat', symbol: 'MMK', decimals: 0, defaultPosition: 'suffix' },
  USD: { name: 'US Dollar', symbol: '$', decimals: 2, defaultPosition: 'prefix' },
  EUR: { name: 'Euro', symbol: '€', decimals: 2, defaultPosition: 'prefix' },
  GBP: { name: 'British Pound', symbol: '£', decimals: 2, defaultPosition: 'prefix' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', decimals: 2, defaultPosition: 'prefix' },
  THB: { name: 'Thai Baht', symbol: '฿', decimals: 2, defaultPosition: 'prefix' },
  JPY: { name: 'Japanese Yen', symbol: '¥', decimals: 0, defaultPosition: 'prefix' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$', decimals: 2, defaultPosition: 'prefix' },
  AUD: { name: 'Australian Dollar', symbol: 'AU$', decimals: 2, defaultPosition: 'prefix' },
  INR: { name: 'Indian Rupee', symbol: '₹', decimals: 2, defaultPosition: 'prefix' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', decimals: 2, defaultPosition: 'prefix' },
};

/**
 * Format monetary amount with appropriate symbol, commas, and negative signs.
 * Changing currency display does not alter the numeric values.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'MMK',
  customPosition?: 'prefix' | 'suffix'
): string {
  const config = CURRENCIES[currencyCode] || {
    name: currencyCode,
    symbol: currencyCode,
    decimals: 2,
    defaultPosition: 'suffix',
  };

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNum = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  const position = customPosition || config.defaultPosition;
  const sign = isNegative ? '-' : '';

  if (position === 'prefix') {
    return `${sign}${config.symbol}${formattedNum}`;
  } else {
    return `${sign}${formattedNum} ${config.symbol}`;
  }
}

/**
 * Format a Date as a local YYYY-MM-DD string.
 * Avoids the UTC drift of toISOString() for users east/west of UTC.
 */
export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 */
function parseISODate(isoDate: string): Date | null {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

/**
 * Short, human date for dense rows (e.g. "Oct 24").
 */
export function formatDateShort(isoDate: string): string {
  const date = parseISODate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Long date for detail panels (e.g. "Saturday, October 24, 2026").
 */
export function formatDateLong(isoDate: string): string {
  const date = parseISODate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns the exact number of days in a given year and month (1-12)
 * Handles leap years properly (e.g. Feb in 2024 has 29 days).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculates how many days have elapsed in the selected month relative to a reference date.
 * - If past month: returns all days in that month.
 * - If future month: returns 0 days (or 1 if evaluating minimal).
 * - If current month: returns referenceDate.getDate().
 */
export function getElapsedDaysInMonth(
  year: number,
  month: number,
  referenceDate: Date = new Date()
): { daysElapsed: number; totalDays: number; isCurrentMonth: boolean } {
  const totalDays = getDaysInMonth(year, month);
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-12

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month: full month has elapsed
    return { daysElapsed: totalDays, totalDays, isCurrentMonth: false };
  } else if (year === currentYear && month === currentMonth) {
    // Current month: days up to today
    const currentDay = Math.min(referenceDate.getDate(), totalDays);
    return { daysElapsed: Math.max(1, currentDay), totalDays, isCurrentMonth: true };
  } else {
    // Future month
    return { daysElapsed: 0, totalDays, isCurrentMonth: false };
  }
}

/**
 * Format year and month as standard YYYY-MM
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Strict filtering of transactions that belong exclusively to the given calendar month.
 * Uses ISO transactionDate string directly to avoid timezone drift errors.
 */
export function filterTransactionsByMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const targetPrefix = formatYearMonth(year, month);
  return transactions.filter((t) => t.transactionDate && t.transactionDate.startsWith(targetPrefix));
}

/**
 * Returns previous month and year tuple
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Returns next month and year tuple
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Core Monthly Financial Summary Calculation.
 * Monthly Balance = Total Income - Total Expenses
 * Strict rules:
 * - Only includes transactions belonging to the selected calendar month.
 * - Uses transaction_date, not record creation date.
 * - Excludes transactions from other months.
 * - Negative balances display the negative amount, not zero.
 * - If income is zero and expenses > 0, display deficit correctly without dividing by zero.
 * - Does not treat previous month's balance as new income.
 */
export function calculateMonthlySummary(
  allTransactions: Transaction[],
  categories: Category[],
  year: number,
  month: number,
  referenceDate: Date = new Date()
): MonthlySummary {
  const monthTransactions = filterTransactionsByMonth(allTransactions, year, month);

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpendingMap: Record<string, number> = {};

  for (const tx of monthTransactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amount;
    } else if (tx.type === 'expense') {
      totalExpenses += amount;
      categorySpendingMap[tx.categoryId] = (categorySpendingMap[tx.categoryId] || 0) + amount;
    }
  }

  // Monthly Balance = Total Income - Total Expenses
  const monthlyBalance = totalIncome - totalExpenses;
  const moneyLeft = monthlyBalance;
  const isDeficit = monthlyBalance < 0;

  // Expense percentage relative to income (handled safely)
  let expensePercentage: number | null = null;
  if (totalIncome > 0) {
    expensePercentage = (totalExpenses / totalIncome) * 100;
  }

  // Days calculation
  const { daysElapsed, totalDays, isCurrentMonth } = getElapsedDaysInMonth(year, month, referenceDate);
  const calculationDays = daysElapsed > 0 ? daysElapsed : totalDays;
  const dailyAverageExpense = calculationDays > 0 ? totalExpenses / calculationDays : 0;

  // Highest spending category
  let highestSpendingCategory: HighestSpendingCategory | null = null;
  let maxSpend = 0;
  let highestCatId: string | null = null;

  for (const [catId, spend] of Object.entries(categorySpendingMap)) {
    if (spend > maxSpend) {
      maxSpend = spend;
      highestCatId = catId;
    }
  }

  if (highestCatId && maxSpend > 0) {
    const cat = categories.find((c) => c.id === highestCatId);
    highestSpendingCategory = {
      categoryId: highestCatId,
      categoryName: cat?.name || 'Unknown Category',
      categoryColor: cat?.color || '#94a3b8',
      categoryIcon: cat?.icon || 'Receipt',
      amount: maxSpend,
      percentage: totalExpenses > 0 ? (maxSpend / totalExpenses) * 100 : 0,
    };
  }

  // Previous month comparison
  const prev = getPreviousMonth(year, month);
  const prevMonthTransactions = filterTransactionsByMonth(allTransactions, prev.year, prev.month);
  let previousIncome = 0;
  let previousExpenses = 0;

  for (const tx of prevMonthTransactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') previousIncome += amount;
    else if (tx.type === 'expense') previousExpenses += amount;
  }

  const previousBalance = previousIncome - previousExpenses;
  const incomeChangeAmount = totalIncome - previousIncome;
  const incomeChangePercent = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : null;
  const expenseChangeAmount = totalExpenses - previousExpenses;
  const expenseChangePercent = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : null;
  const balanceChangeAmount = monthlyBalance - previousBalance;

  const previousMonthComparison: PreviousMonthComparison = {
    previousIncome,
    previousExpenses,
    previousBalance,
    incomeChangeAmount,
    incomeChangePercent,
    expenseChangeAmount,
    expenseChangePercent,
    balanceChangeAmount,
  };

  return {
    year,
    month,
    totalIncome,
    totalExpenses,
    monthlyBalance,
    moneyLeft,
    isDeficit,
    expensePercentage,
    dailyAverageExpense,
    daysElapsedInMonth: daysElapsed,
    totalDaysInMonth: totalDays,
    isCurrentMonth,
    highestSpendingCategory,
    previousMonthComparison,
  };
}

/**
 * Breakdown of expenses by category for a set of transactions
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[]
): CategoryBreakdownItem[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const map = new Map<string, { amount: number; count: number }>();

  for (const t of expenseTransactions) {
    const current = map.get(t.categoryId) || { amount: 0, count: 0 };
    current.amount += Number(t.amount) || 0;
    current.count += 1;
    map.set(t.categoryId, current);
  }

  const result: CategoryBreakdownItem[] = [];

  map.forEach((value, catId) => {
    const cat = categories.find((c) => c.id === catId);
    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Uncategorized',
      color: cat?.color || '#94a3b8',
      icon: cat?.icon || 'Receipt',
      amount: value.amount,
      percentage: totalExpense > 0 ? (value.amount / totalExpense) * 100 : 0,
      transactionCount: value.count,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Breakdown of income by category
 */
export function calculateIncomeBreakdown(
  transactions: Transaction[],
  categories: Category[]
): CategoryBreakdownItem[] {
  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const map = new Map<string, { amount: number; count: number }>();

  for (const t of incomeTransactions) {
    const current = map.get(t.categoryId) || { amount: 0, count: 0 };
    current.amount += Number(t.amount) || 0;
    current.count += 1;
    map.set(t.categoryId, current);
  }

  const result: CategoryBreakdownItem[] = [];

  map.forEach((value, catId) => {
    const cat = categories.find((c) => c.id === catId);
    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Uncategorized',
      color: cat?.color || '#10b981',
      icon: cat?.icon || 'Coins',
      amount: value.amount,
      percentage: totalIncome > 0 ? (value.amount / totalIncome) * 100 : 0,
      transactionCount: value.count,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Daily financial activity for a calendar month
 */
export function calculateDailyActivity(
  transactions: Transaction[],
  year: number,
  month: number
): DailyActivity[] {
  const totalDays = getDaysInMonth(year, month);
  const monthTransactions = filterTransactionsByMonth(transactions, year, month);

  const dailyMap = new Map<number, { income: number; expense: number; count: number }>();

  for (let day = 1; day <= totalDays; day++) {
    dailyMap.set(day, { income: 0, expense: 0, count: 0 });
  }

  for (const t of monthTransactions) {
    const day = parseInt(t.transactionDate.substring(8, 10), 10);
    if (day >= 1 && day <= totalDays) {
      const stats = dailyMap.get(day)!;
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') stats.income += amt;
      else stats.expense += amt;
      stats.count += 1;
    }
  }

  let cumulativeExpense = 0;
  const result: DailyActivity[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const stats = dailyMap.get(day)!;
    cumulativeExpense += stats.expense;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      dayNumber: day,
      income: stats.income,
      expense: stats.expense,
      net: stats.income - stats.expense,
      cumulativeExpense,
      transactionCount: stats.count,
    });
  }

  return result;
}

/**
 * Month name helper
 */
export function getMonthName(monthNumber: number): string {
  const date = new Date(2026, monthNumber - 1, 1);
  return date.toLocaleString('default', { month: 'long' });
}

/**
 * Short month name helper
 */
export function getShortMonthName(monthNumber: number): string {
  const date = new Date(2026, monthNumber - 1, 1);
  return date.toLocaleString('default', { month: 'short' });
}
