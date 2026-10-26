/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction, Category, MonthlySummary, UserSettings } from '../types/finance.ts';
import { MonthSelector } from './MonthSelector.tsx';
import { SummaryCards } from './SummaryCards.tsx';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart.tsx';
import { CategoryBreakdownChart } from './CategoryBreakdownChart.tsx';
import { RecentTransactionsList } from './RecentTransactionsList.tsx';
import { calculateCategoryBreakdown, filterTransactionsByMonth, formatCurrency } from '../utils/finance.ts';
import { Plus, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
  summary: MonthlySummary;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onViewAllTransactions: () => void;
  onNavigateToCalendar: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  year,
  month,
  onMonthChange,
  transactions,
  categories,
  settings,
  summary,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onViewAllTransactions,
  onNavigateToCalendar,
}) => {
  const monthTransactions = filterTransactionsByMonth(transactions, year, month);
  const categoryBreakdown = calculateCategoryBreakdown(monthTransactions, categories);

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of daily income, spending habits, and remaining monthly balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MonthSelector year={year} month={month} onChange={onMonthChange} />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} currency={settings.currency} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-6">
          <IncomeVsExpensesChart summary={summary} currency={settings.currency} />
        </div>

        {/* Expense Category Breakdown */}
        <div className="lg:col-span-6">
          <CategoryBreakdownChart
            items={categoryBreakdown}
            currency={settings.currency}
            totalExpense={summary.totalExpenses}
          />
        </div>
      </div>

      {/* Quick Action Banner & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Transactions List */}
        <div className="lg:col-span-8">
          <RecentTransactionsList
            transactions={monthTransactions}
            categories={categories}
            currency={settings.currency}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
            onViewAll={onViewAllTransactions}
          />
        </div>

        {/* Sidebar Insights & Quick Calendar Link */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Record CTA Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs">
            <h4 className="text-base font-bold">Record Daily Spending</h4>
            <p className="mt-1 text-xs text-emerald-100 leading-relaxed">
              Consistently tracking daily income and small expenses builds an accurate picture of your monthly cash flow.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-800 bg-white hover:bg-emerald-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log New Transaction</span>
            </button>
          </div>

          {/* Quick Calendar Card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Calendar View</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View spending activity day by day
                </p>
              </div>
              <button
                onClick={onNavigateToCalendar}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Month Transactions:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {monthTransactions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Daily Expense Avg:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(summary.dailyAverageExpense, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
