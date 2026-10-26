/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Transaction, UserSettings } from '../types/finance.ts';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'MMK',
  currencyPosition: 'suffix',
  firstDayOfWeek: 1, // Monday
  theme: 'light',
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  {
    id: 'cat-inc-salary',
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981', // emerald
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-freelance',
    name: 'Freelance',
    type: 'income',
    icon: 'Laptop',
    color: '#06b6d4', // cyan
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-business',
    name: 'Business',
    type: 'income',
    icon: 'Building2',
    color: '#3b82f6', // blue
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-investment',
    name: 'Investment',
    type: 'income',
    icon: 'TrendingUp',
    color: '#6366f1', // indigo
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-allowance',
    name: 'Allowance',
    type: 'income',
    icon: 'HandCoins',
    color: '#8b5cf6', // violet
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-gift',
    name: 'Gift',
    type: 'income',
    icon: 'Gift',
    color: '#ec4899', // pink
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-inc-other',
    name: 'Other Income',
    type: 'income',
    icon: 'Coins',
    color: '#14b8a6', // teal
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  // Expense categories
  {
    id: 'cat-exp-food',
    name: 'Food & Drinks',
    type: 'expense',
    icon: 'Utensils',
    color: '#f59e0b', // amber
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-transport',
    name: 'Transportation',
    type: 'expense',
    icon: 'Car',
    color: '#f97316', // orange
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-shopping',
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#fb7185', // rose
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-housing',
    name: 'Housing & Bills',
    type: 'expense',
    icon: 'Home',
    color: '#ef4444', // red
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-education',
    name: 'Education',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#a855f7', // purple
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-healthcare',
    name: 'Healthcare',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#059669', // emerald dark
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-entertainment',
    name: 'Entertainment',
    type: 'expense',
    icon: 'Gamepad2',
    color: '#d946ef', // fuchsia
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-travel',
    name: 'Travel',
    type: 'expense',
    icon: 'Plane',
    color: '#0284c7', // sky
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-personal',
    name: 'Personal Care',
    type: 'expense',
    icon: 'Sparkles',
    color: '#db2777', // pink
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat-exp-other',
    name: 'Other Expenses',
    type: 'expense',
    icon: 'Receipt',
    color: '#64748b', // slate
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

/**
 * Realistic initial seed transactions for demo & everyday onboarding.
 * Total Income for October 2026: 800,000 MMK
 * Total Expenses for October 2026: 350,000 MMK
 * Monthly Balance: 450,000 MMK (Matches exact prompt example!)
 */
export const SEED_TRANSACTIONS: Transaction[] = [
  // October 2026 Transactions (Current month: 800,000 MMK income, 350,000 MMK expenses -> 450,000 MMK Money Left)
  {
    id: 'tx-oct-01',
    userId: 'default-user',
    type: 'income',
    amount: 700000,
    categoryId: 'cat-inc-salary',
    transactionDate: '2026-10-01',
    description: 'Monthly Salary direct deposit',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'tx-oct-02',
    userId: 'default-user',
    type: 'income',
    amount: 100000,
    categoryId: 'cat-inc-freelance',
    transactionDate: '2026-10-15',
    description: 'UI Design consulting project payment',
    paymentMethod: 'Mobile Wallet',
    createdAt: '2026-10-15T14:30:00Z',
    updatedAt: '2026-10-15T14:30:00Z',
  },
  {
    id: 'tx-oct-03',
    userId: 'default-user',
    type: 'expense',
    amount: 140000,
    categoryId: 'cat-exp-housing',
    transactionDate: '2026-10-03',
    description: 'Apartment rent & high-speed fiber internet',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-03T11:00:00Z',
  },
  {
    id: 'tx-oct-04',
    userId: 'default-user',
    type: 'expense',
    amount: 85000,
    categoryId: 'cat-exp-food',
    transactionDate: '2026-10-07',
    description: 'Weekly grocery store run and fresh market produce',
    paymentMethod: 'Cash',
    createdAt: '2026-10-07T16:20:00Z',
    updatedAt: '2026-10-07T16:20:00Z',
  },
  {
    id: 'tx-oct-05',
    userId: 'default-user',
    type: 'expense',
    amount: 35000,
    categoryId: 'cat-exp-transport',
    transactionDate: '2026-10-11',
    description: 'Fuel top-up and weekly transit pass',
    paymentMethod: 'Cash',
    createdAt: '2026-10-11T08:45:00Z',
    updatedAt: '2026-10-11T08:45:00Z',
  },
  {
    id: 'tx-oct-06',
    userId: 'default-user',
    type: 'expense',
    amount: 45000,
    categoryId: 'cat-exp-food',
    transactionDate: '2026-10-18',
    description: 'Dinner with colleagues at local bistro',
    paymentMethod: 'Mobile Wallet',
    createdAt: '2026-10-18T20:00:00Z',
    updatedAt: '2026-10-18T20:00:00Z',
  },
  {
    id: 'tx-oct-07',
    userId: 'default-user',
    type: 'expense',
    amount: 25000,
    categoryId: 'cat-exp-healthcare',
    transactionDate: '2026-10-21',
    description: 'Prescription refills and daily vitamins',
    paymentMethod: 'Mobile Wallet',
    createdAt: '2026-10-21T10:15:00Z',
    updatedAt: '2026-10-21T10:15:00Z',
  },
  {
    id: 'tx-oct-08',
    userId: 'default-user',
    type: 'expense',
    amount: 20000,
    categoryId: 'cat-exp-entertainment',
    transactionDate: '2026-10-24',
    description: 'Streaming subscriptions and cinema ticket',
    paymentMethod: 'Credit Card',
    createdAt: '2026-10-24T18:00:00Z',
    updatedAt: '2026-10-24T18:00:00Z',
  },

  // September 2026 (Previous month for historical comparison)
  {
    id: 'tx-sep-01',
    userId: 'default-user',
    type: 'income',
    amount: 750000,
    categoryId: 'cat-inc-salary',
    transactionDate: '2026-09-01',
    description: 'Monthly Salary',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'tx-sep-02',
    userId: 'default-user',
    type: 'expense',
    amount: 140000,
    categoryId: 'cat-exp-housing',
    transactionDate: '2026-09-03',
    description: 'Apartment rent',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-09-03T11:00:00Z',
    updatedAt: '2026-09-03T11:00:00Z',
  },
  {
    id: 'tx-sep-03',
    userId: 'default-user',
    type: 'expense',
    amount: 120000,
    categoryId: 'cat-exp-food',
    transactionDate: '2026-09-14',
    description: 'Groceries & dining out',
    paymentMethod: 'Cash',
    createdAt: '2026-09-14T17:00:00Z',
    updatedAt: '2026-09-14T17:00:00Z',
  },
  {
    id: 'tx-sep-04',
    userId: 'default-user',
    type: 'expense',
    amount: 60000,
    categoryId: 'cat-exp-shopping',
    transactionDate: '2026-09-22',
    description: 'Work shoes and stationery supplies',
    paymentMethod: 'Credit Card',
    createdAt: '2026-09-22T15:00:00Z',
    updatedAt: '2026-09-22T15:00:00Z',
  },

  // August 2026
  {
    id: 'tx-aug-01',
    userId: 'default-user',
    type: 'income',
    amount: 750000,
    categoryId: 'cat-inc-salary',
    transactionDate: '2026-08-01',
    description: 'Monthly Salary',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'tx-aug-02',
    userId: 'default-user',
    type: 'expense',
    amount: 310000,
    categoryId: 'cat-exp-housing',
    transactionDate: '2026-08-05',
    description: 'Rent and annual maintenance fee',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z',
  },
];
