/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CategoryBreakdownItem } from '../types/finance.ts';
import { formatCurrency } from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryBreakdownChartProps {
  items: CategoryBreakdownItem[];
  currency: string;
  totalExpense: number;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  items,
  currency,
  totalExpense,
}) => {
  if (items.length === 0 || totalExpense === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No Expenses Recorded</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          There are no expense transactions for this month yet. Log daily expenses to see category breakdowns.
        </p>
      </div>
    );
  }

  // Pre-calculate SVG Donut slices
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 22;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Expense Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spending distribution by category
          </p>
        </div>
        <span className="text-xs font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
          {items.length} {items.length === 1 ? 'Category' : 'Categories'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Donut */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Segment Slices */}
            {items.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle;
              cumulativeAngle += (item.percentage / 100) * circumference;

              return (
                <circle
                  key={item.categoryId}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-85"
                />
              );
            })}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Total Spent
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 px-2 truncate max-w-[120px]">
              {formatCurrency(totalExpense, currency)}
            </span>
          </div>
        </div>

        {/* Categories Detail List */}
        <div className="md:col-span-7 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  <CategoryIcon name={item.icon} size={11} color="#ffffff" />
                </div>
                <div className="truncate">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.categoryName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.amount, currency)}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
