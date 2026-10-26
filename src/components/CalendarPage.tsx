/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Plus, Trash2 } from 'lucide-react';
import { Transaction, Category, UserSettings } from '../types/finance.ts';
import { MonthSelector } from './MonthSelector.tsx';
import {
  formatCurrency,
  formatDateLong,
  formatDateShort,
  getDaysInMonth,
  getMonthName,
  toISODate,
} from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  cn,
} from './ui.tsx';

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

interface DayData {
  income: number;
  expense: number;
  count: number;
  items: Transaction[];
}

const EMPTY_DAY: DayData = { income: 0, expense: 0, count: 0, items: [] };

function defaultDateForMonth(year: number, month: number): string {
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const day = isCurrentMonth ? today.getDate() : 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  const todayISO = toISODate();
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    defaultDateForMonth(year, month)
  );

  // Keep the detail panel anchored to a real day when the visible month changes.
  useEffect(() => {
    setSelectedDate(defaultDateForMonth(year, month));
  }, [year, month]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const dailyDataMap = useMemo(() => {
    const map = new Map<string, DayData>();

    for (const tx of transactions) {
      if (!tx.transactionDate.startsWith(monthPrefix)) continue;

      const existing = map.get(tx.transactionDate) || {
        income: 0,
        expense: 0,
        count: 0,
        items: [],
      };

      if (tx.type === 'income') existing.income += tx.amount;
      else existing.expense += tx.amount;

      existing.count += 1;
      existing.items.push(tx);
      map.set(tx.transactionDate, existing);
    }

    return map;
  }, [transactions, monthPrefix]);

  const monthEntryCount = useMemo(
    () => Array.from(dailyDataMap.values()).reduce((sum, day) => sum + day.count, 0),
    [dailyDataMap]
  );

  const totalDays = getDaysInMonth(year, month);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  let leadingBlanks = firstWeekday - settings.firstDayOfWeek;
  if (leadingBlanks < 0) leadingBlanks += 7;

  const totalCells = Math.ceil((leadingBlanks + totalDays) / 7) * 7;
  const trailingBlanks = totalCells - leadingBlanks - totalDays;

  const weekdayLabels =
    settings.firstDayOfWeek === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDay = dailyDataMap.get(selectedDate) || EMPTY_DAY;
  const selectedNet = selectedDay.income - selectedDay.expense;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Calendar"
        description="See how spending and income are spread across the month."
        actions={<MonthSelector year={year} month={month} onChange={onMonthChange} />}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <Panel className="overflow-hidden lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight text-ink">
                {getMonthName(month)} {year}
              </h2>
              <p className="text-[11px] text-muted">
                {monthEntryCount}{' '}
                {monthEntryCount === 1 ? 'entry' : 'entries'} this month
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-income" aria-hidden="true" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-expense" aria-hidden="true" />
                Spending
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {weekdayLabels.map((day) => (
                <div
                  key={day}
                  className="pb-1.5 text-center text-[10px] font-medium text-faint"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div
                  key={`leading-${index}`}
                  className="min-h-[52px] sm:min-h-[84px]"
                  aria-hidden="true"
                />
              ))}

              {Array.from({ length: totalDays }, (_, index) => index + 1).map((dayNumber) => {
                const dateStr = `${monthPrefix}-${String(dayNumber).padStart(2, '0')}`;
                const day = dailyDataMap.get(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = todayISO === dateStr;
                const net = day ? day.income - day.expense : 0;

                const ariaLabel = day
                  ? `${formatDateLong(dateStr)}, ${day.count} ${
                      day.count === 1 ? 'entry' : 'entries'
                    }, net ${formatCurrency(net, settings.currency)}`
                  : `${formatDateLong(dateStr)}, no entries`;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    aria-pressed={isSelected}
                    aria-label={ariaLabel}
                    className={cn(
                      'relative flex min-h-[52px] flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-[84px] sm:p-2',
                      isSelected
                        ? 'border-ink bg-surface-2'
                        : 'border-rule bg-surface hover:border-rule-strong hover:bg-surface-2/60'
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded-md font-mono text-[10px] font-medium tabular-nums sm:text-[11px]',
                          isToday ? 'bg-ink text-canvas' : 'text-muted'
                        )}
                      >
                        {dayNumber}
                      </span>

                      {day && (
                        <span className="flex items-center gap-0.5" aria-hidden="true">
                          {day.income > 0 && (
                            <span className="size-1.5 rounded-full bg-income" />
                          )}
                          {day.expense > 0 && (
                            <span className="size-1.5 rounded-full bg-expense" />
                          )}
                        </span>
                      )}
                    </span>

                    {day && (
                      <span
                        className={cn(
                          'mt-auto hidden truncate pt-1 font-mono text-[10px] font-medium tabular-nums sm:block',
                          net < 0 ? 'text-expense' : net > 0 ? 'text-income' : 'text-faint'
                        )}
                      >
                        {net > 0 ? '+' : ''}
                        {formatCurrency(net, settings.currency)}
                      </span>
                    )}
                  </button>
                );
              })}

              {Array.from({ length: trailingBlanks }).map((_, index) => (
                <div
                  key={`trailing-${index}`}
                  className="min-h-[52px] sm:min-h-[84px]"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="lg:sticky lg:top-6 lg:col-span-4">
          <div className="flex items-start justify-between gap-3 border-b border-rule px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 className="font-display text-[15px] font-semibold leading-tight tracking-tight text-ink">
                {formatDateLong(selectedDate)}
              </h2>
              <p className="mt-1 text-[11px] text-muted">
                {selectedDay.count === 0
                  ? 'No entries recorded'
                  : `${selectedDay.count} ${selectedDay.count === 1 ? 'entry' : 'entries'}`}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAddModalWithDate(selectedDate)}
              className="shrink-0"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Add</span>
            </Button>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
            <div className="px-3 py-3">
              <dt className="text-[10px] text-muted">Income</dt>
              <dd className="mt-1 truncate font-mono text-xs font-medium tabular-nums text-income">
                {selectedDay.income > 0
                  ? `+${formatCurrency(selectedDay.income, settings.currency)}`
                  : '—'}
              </dd>
            </div>
            <div className="px-3 py-3">
              <dt className="text-[10px] text-muted">Expenses</dt>
              <dd className="mt-1 truncate font-mono text-xs font-medium tabular-nums text-expense">
                {selectedDay.expense > 0
                  ? `-${formatCurrency(selectedDay.expense, settings.currency)}`
                  : '—'}
              </dd>
            </div>
            <div className="px-3 py-3">
              <dt className="text-[10px] text-muted">Net</dt>
              <dd
                className={cn(
                  'mt-1 truncate font-mono text-xs font-medium tabular-nums',
                  selectedNet < 0 ? 'text-expense' : 'text-ink'
                )}
              >
                {formatCurrency(selectedNet, settings.currency)}
              </dd>
            </div>
          </dl>

          {selectedDay.items.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nothing on this day"
              description={`Add an income or expense entry for ${formatDateShort(selectedDate)}.`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => onOpenAddModalWithDate(selectedDate)}
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Add entry</span>
                </Button>
              }
            />
          ) : (
            <ul className="max-h-[420px] divide-y divide-rule overflow-y-auto">
              {selectedDay.items.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <li key={tx.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <CategoryAvatar category={category} size="md" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">
                        {category?.name || 'Uncategorized'}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted">
                        {tx.description || tx.paymentMethod || 'No note'}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'shrink-0 font-mono text-[11px] font-medium tabular-nums',
                        isIncome ? 'text-income' : 'text-expense'
                      )}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={`Edit ${category?.name || 'entry'}`}
                        onClick={() => onEditTransaction(tx)}
                        className="size-8 text-faint hover:text-ink"
                      >
                        <Edit2 className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${category?.name || 'entry'}`}
                        onClick={() => onDeleteTransaction(tx)}
                        className="size-8 text-faint hover:bg-expense-soft hover:text-expense"
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};
