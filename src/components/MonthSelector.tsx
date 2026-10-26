/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getMonthName, getNextMonth, getPreviousMonth } from '../utils/finance.ts';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ year, month, onChange }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;

  const handlePrevious = () => {
    const prev = getPreviousMonth(year, month);
    onChange(prev.year, prev.month);
  };

  const handleNext = () => {
    const next = getNextMonth(year, month);
    onChange(next.year, next.month);
  };

  const handleCurrent = () => {
    onChange(currentYear, currentMonth);
  };

  // Generate selectable years (-3 to +1)
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrevious}
          aria-label="Previous month"
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-2">
          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => onChange(year, parseInt(e.target.value, 10))}
            className="text-base font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
          >
            {months.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {getMonthName(m)}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => onChange(parseInt(e.target.value, 10), month)}
            className="text-base font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 py-0.5"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNext}
          aria-label="Next month"
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isCurrentMonth ? (
          <button
            onClick={handleCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jump to Current Month</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 py-1">
            Current Calendar Period
          </span>
        )}
      </div>
    </div>
  );
};
