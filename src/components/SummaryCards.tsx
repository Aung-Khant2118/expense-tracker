/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MonthlySummary } from '../types/finance.ts';
import { formatCurrency, getMonthName } from '../utils/finance.ts';

interface SummaryCardsProps {
  summary: MonthlySummary;
  currency: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, currency }) => {
  const {
    year,
    month,
    totalIncome,
    totalExpenses,
    monthlyBalance,
    isDeficit,
    dailyAverageExpense,
    daysElapsedInMonth,
    totalDaysInMonth,
    isCurrentMonth,
    previousMonthComparison,
  } = summary;

  // Calculation period text
  const calculationPeriodText = isCurrentMonth
    ? `${daysElapsedInMonth} days elapsed (${getMonthName(month).slice(0, 3)} 1–${daysElapsedInMonth})`
    : `Full month (${totalDaysInMonth} days)`;

  return (
    <div className="space-y-4">
      {/* Deficit Alert Banner if Expenses > Income */}
      {isDeficit && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Monthly Deficit Warning: </span>
            Expenses exceed total income by{' '}
            <span className="font-mono font-semibold tabular-nums">
              {formatCurrency(Math.abs(monthlyBalance), currency)}
            </span>
            {summary.expensePercentage !== null && (
              <span> ({summary.expensePercentage.toFixed(1)}% of income spent).</span>
            )}
            <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
              Consider reviewing discretionary spending or recording pending income receipts.
            </p>
          </div>
        </div>
      )}

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>
          {previousMonthComparison?.incomeChangePercent !== null && previousMonthComparison?.incomeChangePercent !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {previousMonthComparison.incomeChangeAmount >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              )}
              <span className={previousMonthComparison.incomeChangeAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
                {Math.abs(previousMonthComparison.incomeChangePercent).toFixed(1)}%
              </span>
              <span>vs previous month</span>
            </div>
          )}
        </div>

        {/* Card 2: Total Expenses */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses, currency)}
            </div>
          </div>
          {previousMonthComparison?.expenseChangePercent !== null && previousMonthComparison?.expenseChangePercent !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {previousMonthComparison.expenseChangeAmount > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className={previousMonthComparison.expenseChangeAmount > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                {Math.abs(previousMonthComparison.expenseChangePercent).toFixed(1)}%
              </span>
              <span>vs previous month</span>
            </div>
          )}
        </div>

        {/* Card 3: Monthly Balance / Money Left */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Balance
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDeficit
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold font-mono tabular-nums ${
              isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}>
              {formatCurrency(monthlyBalance, currency)}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{isDeficit ? 'Monthly Deficit' : 'Money Left'}</span>
            {summary.expensePercentage !== null ? (
              <span className="font-mono tabular-nums font-medium">
                {summary.expensePercentage.toFixed(0)}% spent
              </span>
            ) : (
              <span className="font-mono tabular-nums text-slate-400">No income</span>
            )}
          </div>
        </div>

        {/* Card 4: Daily Spending Average */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Daily Spending Avg
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatCurrency(dailyAverageExpense, currency)}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <span>Period:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {calculationPeriodText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
