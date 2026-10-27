/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getNextMonth, getPreviousMonth } from '../utils/finance.ts';
import { IconButton } from './ui.tsx';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ year, month, onChange }) => {
  const monthId = useId();
  const yearId = useId();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;

  const years = Array.from(
    new Set([
      currentYear - 5,
      currentYear - 4,
      currentYear - 3,
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      year,
    ])
  ).sort((a, b) => a - b);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handlePrevious = () => {
    const previous = getPreviousMonth(year, month);
    onChange(previous.year, previous.month);
  };

  const handleNext = () => {
    const next = getNextMonth(year, month);
    onChange(next.year, next.month);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex h-9 items-center rounded-none border-2 border-ink bg-surface shadow-brutal-xs">
        <IconButton
          label="Previous month"
          onClick={handlePrevious}
          className="size-8 rounded-r-none"
        >
          <ChevronLeft className="size-4" />
        </IconButton>

        <div className="flex items-center px-1">
          <label htmlFor={monthId} className="sr-only">
            Month
          </label>
          <select
            id={monthId}
            value={month}
            onChange={(event) => onChange(year, parseInt(event.target.value, 10))}
            className="h-8 cursor-pointer rounded-none bg-transparent px-1 text-sm font-bold text-ink"
          >
            {months.map((value) => (
              <option key={value} value={value}>
                {getMonthName(value)}
              </option>
            ))}
          </select>

          <label htmlFor={yearId} className="sr-only">
            Year
          </label>
          <select
            id={yearId}
            value={year}
            onChange={(event) => onChange(parseInt(event.target.value, 10), month)}
            className="h-8 cursor-pointer rounded-none bg-transparent px-1 font-mono text-sm font-semibold text-muted"
          >
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <IconButton
          label="Next month"
          onClick={handleNext}
          className="size-8 rounded-l-none"
        >
          <ChevronRight className="size-4" />
        </IconButton>
      </div>

      {isCurrentMonth ? (
        <span className="hidden text-[11px] font-semibold text-muted sm:inline">Current month</span>
      ) : (
        <button
          type="button"
          onClick={() => onChange(currentYear, currentMonth)}
          className="inline-flex h-9 items-center gap-1.5 rounded-none border-2 border-transparent px-2.5 text-xs font-semibold text-muted transition-colors hover:border-ink hover:bg-surface-2 hover:text-ink"
        >
          <CalendarDays className="size-3.5" />
          <span>This month</span>
        </button>
      )}
    </div>
  );
};
