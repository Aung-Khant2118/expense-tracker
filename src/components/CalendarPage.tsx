/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Category, UserSettings } from '../types/finance.ts';
import { MonthSelector } from './MonthSelector.tsx';
import { formatCurrency, getDaysInMonth, getMonthName } from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarPageProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
  onOpenAddModalWithDate: (dateStr: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  year,
  month,
  onMonthChange,
  transactions,
  categories,
  settings,
  onOpenAddModalWithDate,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  // Today's ISO date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Default selected date to today if currently in this month, else 1st day of month
  const defaultSelectedDay = `${year}-${String(month).padStart(2, '0')}-${
    year === new Date().getFullYear() && month === new Date().getMonth() + 1
      ? String(new Date().getDate()).padStart(2, '0')
      : '01'
  }`;

  const [selectedDate, setSelectedDate] = useState<string>(defaultSelectedDay);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Days in month
  const totalDays = getDaysInMonth(year, month);

  // Group transactions for this month by date
  const monthTransactions = transactions.filter((t) =>
    t.transactionDate.startsWith(`${year}-${String(month).padStart(2, '0')}`)
  );

  const dailyDataMap = new Map<string, { income: number; expense: number; count: number; items: Transaction[] }>();
  for (const t of monthTransactions) {
    const existing = dailyDataMap.get(t.transactionDate) || {
      income: 0,
      expense: 0,
      count: 0,
      items: [],
    };
    if (t.type === 'income') existing.income += t.amount;
    else existing.expense += t.amount;
    existing.count += 1;
    existing.items.push(t);
    dailyDataMap.set(t.transactionDate, existing);
  }

  // First day of month offset
  // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const firstDayOfMonthDate = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDayOfMonthDate.getDay();

  // Offset based on settings.firstDayOfWeek (0 = Sunday, 1 = Monday)
  let blankDays = startDayOfWeek - settings.firstDayOfWeek;
  if (blankDays < 0) blankDays += 7;

  // Day names header
  const weekDayLabels = settings.firstDayOfWeek === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Selected date data
  const selectedDayData = dailyDataMap.get(selectedDate) || {
    income: 0,
    expense: 0,
    count: 0,
    items: [],
  };

  const selectedNet = selectedDayData.income - selectedDayData.expense;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize daily earnings, daily expenses, and net daily balances
          </p>
        </div>

        <MonthSelector year={year} month={month} onChange={onMonthChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 sm:p-5">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            {weekDayLabels.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {/* Blank leading days */}
            {Array.from({ length: blankDays }).map((_, idx) => (
              <div
                key={`blank-${idx}`}
                className="h-20 sm:h-24 bg-slate-50/40 dark:bg-slate-800/20 rounded-lg border border-transparent"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNumber) => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayData = dailyDataMap.get(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={dayNumber}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 flex flex-col justify-between text-left rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold rounded-md px-1.5 py-0.5 ${
                        isToday
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {dayData && dayData.count > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dayData.count} tx
                      </span>
                    )}
                  </div>

                  {/* Daily Badges */}
                  <div className="space-y-0.5 overflow-hidden w-full">
                    {dayData && dayData.income > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold truncate leading-tight">
                        +{formatCurrency(dayData.income, settings.currency)}
                      </div>
                    )}
                    {dayData && dayData.expense > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold truncate leading-tight">
                        -{formatCurrency(dayData.expense, settings.currency)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Transaction Drawer */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Selected Date
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {selectedDate}
              </h3>
            </div>
            <button
              onClick={() => onOpenAddModalWithDate(selectedDate)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>

          {/* Daily Totals Summary */}
          <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Income</span>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatCurrency(selectedDayData.income, settings.currency)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Expenses</span>
              <div className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -{formatCurrency(selectedDayData.expense, settings.currency)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Net</span>
              <div className={`font-mono font-bold tabular-nums ${
                selectedNet < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
              }`}>
                {formatCurrency(selectedNet, settings.currency)}
              </div>
            </div>
          </div>

          {/* Transactions for Selected Day */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Transactions on {selectedDate} ({selectedDayData.items.length})
            </h4>

            {selectedDayData.items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CalendarIcon className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                No transactions recorded on this date.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {selectedDayData.items.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat?.color || '#94a3b8' }}
                        >
                          <CategoryIcon name={cat?.icon || 'Receipt'} size={13} color="#ffffff" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {cat?.name || 'Uncategorized'}
                          </div>
                          {tx.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {tx.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                        </span>
                        <button
                          onClick={() => onEditTransaction(tx)}
                          aria-label="Edit"
                          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx)}
                          aria-label="Delete"
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
