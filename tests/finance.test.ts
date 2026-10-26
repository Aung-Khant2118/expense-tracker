/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import {
  calculateMonthlySummary,
  filterTransactionsByMonth,
  formatCurrency,
  getDaysInMonth,
  getElapsedDaysInMonth,
} from '../src/utils/finance.ts';
import { Category, Transaction } from '../src/types/finance.ts';

const mockCategories: Category[] = [
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981', createdAt: '2026-01-01' },
  { id: 'cat-food', name: 'Food & Drinks', type: 'expense', icon: 'Utensils', color: '#f59e0b', createdAt: '2026-01-01' },
  { id: 'cat-rent', name: 'Housing & Bills', type: 'expense', icon: 'Home', color: '#ef4444', createdAt: '2026-01-01' },
];

console.log('Running FinFlow Financial Calculation Tests...\n');

// Test 1: Core prompt example (800,000 MMK income - 350,000 MMK expenses = 450,000 MMK balance)
{
  console.log('Test 1: Standard monthly income, expenses, and balance calculation');
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      type: 'income',
      amount: 800000,
      categoryId: 'cat-salary',
      transactionDate: '2026-10-05',
      createdAt: '2026-10-05T09:00:00Z',
      updatedAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      type: 'expense',
      amount: 200000,
      categoryId: 'cat-rent',
      transactionDate: '2026-10-10',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      type: 'expense',
      amount: 150000,
      categoryId: 'cat-food',
      transactionDate: '2026-10-15',
      createdAt: '2026-10-15T12:00:00Z',
      updatedAt: '2026-10-15T12:00:00Z',
    },
  ];

  const summary = calculateMonthlySummary(transactions, mockCategories, 2026, 10, new Date('2026-10-26T12:00:00Z'));

  assert.equal(summary.totalIncome, 800000, 'Total income must be 800,000 MMK');
  assert.equal(summary.totalExpenses, 350000, 'Total expenses must be 350,000 MMK');
  assert.equal(summary.monthlyBalance, 450000, 'Monthly balance must be 450,000 MMK');
  assert.equal(summary.moneyLeft, 450000, 'Money left must be 450,000 MMK');
  assert.equal(summary.isDeficit, false, 'Should not be in deficit');
  assert.equal(summary.expensePercentage, 43.75, 'Expense percentage should be 43.75% (350k / 800k)');
  assert.equal(summary.highestSpendingCategory?.categoryName, 'Housing & Bills');
  assert.equal(summary.highestSpendingCategory?.amount, 200000);
  console.log('✓ Test 1 Passed: Core calculations match exactly (450,000 MMK surplus).\n');
}

// Test 2: Deficit scenario & Zero-division safety
{
  console.log('Test 2: Deficit handling when income is zero and expenses exist');
  const transactions: Transaction[] = [
    {
      id: 'tx-def-1',
      userId: 'user-1',
      type: 'expense',
      amount: 75000,
      categoryId: 'cat-food',
      transactionDate: '2026-10-02',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z',
    },
  ];

  const summary = calculateMonthlySummary(transactions, mockCategories, 2026, 10, new Date('2026-10-26T12:00:00Z'));

  assert.equal(summary.totalIncome, 0, 'Total income is 0');
  assert.equal(summary.totalExpenses, 75000, 'Total expenses is 75,000');
  assert.equal(summary.monthlyBalance, -75000, 'Monthly balance must reflect the negative amount, not zero');
  assert.equal(summary.isDeficit, true, 'isDeficit flag must be true');
  assert.equal(summary.expensePercentage, null, 'Expense percentage must be null to prevent division by zero / NaN');
  console.log('✓ Test 2 Passed: Zero division prevented and negative deficit correctly represented.\n');
}

// Test 3: Date Boundary Case - Strictly include calendar month and exclude adjacent dates
{
  console.log('Test 3: Date boundary tests (first day, last day, leap year, adjacent months)');
  const transactions: Transaction[] = [
    // Preceding month boundary
    { id: 'tx-sep-30', userId: 'user-1', type: 'income', amount: 1000, categoryId: 'cat-salary', transactionDate: '2026-09-30', createdAt: '', updatedAt: '' },
    // Current month boundaries
    { id: 'tx-oct-01', userId: 'user-1', type: 'income', amount: 5000, categoryId: 'cat-salary', transactionDate: '2026-10-01', createdAt: '', updatedAt: '' },
    { id: 'tx-oct-15', userId: 'user-1', type: 'expense', amount: 2000, categoryId: 'cat-food', transactionDate: '2026-10-15', createdAt: '', updatedAt: '' },
    { id: 'tx-oct-31', userId: 'user-1', type: 'expense', amount: 1500, categoryId: 'cat-rent', transactionDate: '2026-10-31', createdAt: '', updatedAt: '' },
    // Following month boundary
    { id: 'tx-nov-01', userId: 'user-1', type: 'income', amount: 9999, categoryId: 'cat-salary', transactionDate: '2026-11-01', createdAt: '', updatedAt: '' },
  ];

  const filtered = filterTransactionsByMonth(transactions, 2026, 10);
  assert.equal(filtered.length, 3, 'Must only include the 3 transactions in October 2026');
  assert.ok(filtered.some(t => t.id === 'tx-oct-01'), 'Must include Oct 1st');
  assert.ok(filtered.some(t => t.id === 'tx-oct-31'), 'Must include Oct 31st');
  assert.ok(!filtered.some(t => t.id === 'tx-sep-30'), 'Must NOT include Sep 30');
  assert.ok(!filtered.some(t => t.id === 'tx-nov-01'), 'Must NOT include Nov 01');

  // Leap year check
  assert.equal(getDaysInMonth(2024, 2), 29, 'Feb 2024 is a leap year with 29 days');
  assert.equal(getDaysInMonth(2025, 2), 28, 'Feb 2025 has 28 days');
  assert.equal(getDaysInMonth(2026, 10), 31, 'Oct 2026 has 31 days');
  console.log('✓ Test 3 Passed: Date boundary strictly enforced and leap years handled.\n');
}

// Test 4: Daily Spending Average
{
  console.log('Test 4: Daily spending average calculation logic');
  const referenceDate = new Date('2026-10-20T12:00:00Z'); // 20th day of October
  const { daysElapsed, isCurrentMonth } = getElapsedDaysInMonth(2026, 10, referenceDate);
  assert.equal(daysElapsed, 20, '20 days should have elapsed up to Oct 20th');
  assert.equal(isCurrentMonth, true, 'Should be flagged as current month');

  // Past month
  const pastMonthDays = getElapsedDaysInMonth(2026, 8, referenceDate);
  assert.equal(pastMonthDays.daysElapsed, 31, 'Past month August must count all 31 days');
  assert.equal(pastMonthDays.isCurrentMonth, false);

  const transactions: Transaction[] = [
    { id: 't1', userId: 'u1', type: 'expense', amount: 20000, categoryId: 'cat-food', transactionDate: '2026-10-05', createdAt: '', updatedAt: '' },
    { id: 't2', userId: 'u1', type: 'expense', amount: 30000, categoryId: 'cat-food', transactionDate: '2026-10-12', createdAt: '', updatedAt: '' },
  ];

  const summary = calculateMonthlySummary(transactions, mockCategories, 2026, 10, referenceDate);
  // Total expenses: 50,000 / 20 days elapsed = 2,500/day
  assert.equal(summary.dailyAverageExpense, 2500, 'Daily average must divide 50,000 by 20 days = 2,500');
  console.log('✓ Test 4 Passed: Daily spending average accurately accounts for elapsed days.\n');
}

// Test 5: Currency formatting without data alteration
{
  console.log('Test 5: Currency formatting display with MMK and USD');
  assert.equal(formatCurrency(800000, 'MMK'), '800,000 MMK');
  assert.equal(formatCurrency(-45000, 'MMK'), '-45,000 MMK');
  assert.equal(formatCurrency(1250.5, 'USD'), '$1,250.50');
  assert.equal(formatCurrency(-50, 'USD'), '-$50.00');
  console.log('✓ Test 5 Passed: Currency formatting works cleanly with sign preservation.\n');
}

console.log('ALL 5 TEST SUITES PASSED PERFECTLY!\n');
