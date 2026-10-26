/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MonthlySummary } from '../types/finance.ts';
import { formatCurrency } from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface IncomeVsExpensesChartProps {
  summary: MonthlySummary;
  currency: string;
}

export const IncomeVsExpensesChart: React.FC<IncomeVsExpensesChartProps> = ({
  summary,
  currency,
}) => {
  const { totalIncome, totalExpenses, monthlyBalance, isDeficit, expensePercentage, highestSpendingCategory } = summary;
  const maxVal = Math.max(totalIncome, totalExpenses, 1);
  const incomeHeightPct = Math.min(100, Math.round((totalIncome / maxVal) * 100));
  const expenseHeightPct = Math.min(100, Math.round((totalExpenses / maxVal) * 100));

  const savingsRate = totalIncome > 0 && monthlyBalance > 0
    ? ((monthlyBalance / totalIncome) * 100).toFixed(1)
    : null;

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Monthly Cash Flow
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Income versus expenses comparison
          </p>
        </div>
        {savingsRate && (
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Savings Rate</span>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {savingsRate}%
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-end gap-6 sm:gap-12 justify-center py-4">
        {/* Income Column */}
        <div className="flex flex-col items-center gap-2 w-full sm:w-36">
          <span className="text-xs font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome, currency)}
          </span>
          <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex items-end">
            <div
              style={{ height: `${incomeHeightPct}%` }}
              className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-md transition-all duration-500 flex items-center justify-center min-h-[8px]"
            />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Total Income
          </span>
        </div>

        {/* Expenses Column */}
        <div className="flex flex-col items-center gap-2 w-full sm:w-36">
          <span className="text-xs font-mono font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpenses, currency)}
          </span>
          <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex items-end">
            <div
              style={{ height: `${expenseHeightPct}%` }}
              className="w-full bg-rose-500 dark:bg-rose-600 rounded-md transition-all duration-500 flex items-center justify-center min-h-[8px]"
            />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Total Expenses
          </span>
        </div>

        {/* Net Balance / Money Left Card */}
        <div className="w-full sm:w-52 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between self-stretch">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isDeficit ? 'Net Deficit' : 'Net Remaining'}
            </span>
            <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${
              isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(monthlyBalance, currency)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
            {highestSpendingCategory ? (
              <div>
                <span className="text-slate-500 dark:text-slate-400">Top Spend:</span>
                <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 truncate">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0"
                    style={{ backgroundColor: highestSpendingCategory.categoryColor }}
                  >
                    <CategoryIcon name={highestSpendingCategory.categoryIcon} size={10} color="#fff" />
                  </div>
                  <span className="truncate">{highestSpendingCategory.categoryName}</span>
                  <span className="ml-auto font-mono text-slate-500 tabular-nums">
                    {highestSpendingCategory.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 italic">No expense data</span>
            )}
          </div>
        </div>
      </div>

      {/* Expense-to-Income Ratio Bar */}
      {totalIncome > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-600 dark:text-slate-400">Budget Consumed</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {expensePercentage !== null ? `${expensePercentage.toFixed(1)}%` : '0%'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isDeficit ? 'bg-rose-500' : (expensePercentage || 0) > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, expensePercentage || 0)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
