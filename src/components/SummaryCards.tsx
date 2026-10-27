/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MonthlySummary } from '../types/finance.ts';
import { formatCurrency, getMonthName } from '../utils/finance.ts';
import { cn } from './ui.tsx';

interface SummaryCardsProps {
  summary: MonthlySummary;
  currency: string;
}

interface Change {
  percent: number;
  amount: number;
  favorable: boolean;
}

function ChangeNote({ change }: { change: Change }) {
  const rising = change.amount >= 0;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        'mt-1.5 flex items-center gap-1 text-[11px] font-semibold',
        change.favorable ? 'text-income' : 'text-expense'
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="font-mono tabular-nums">{Math.abs(change.percent).toFixed(1)}%</span>
      <span className="font-medium text-muted">vs last month</span>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  tone?: 'default' | 'income' | 'expense';
  note?: string;
  change?: Change;
}

function Metric({ label, value, tone = 'default', note, change }: MetricProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-5 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold text-ink">
          {tone !== 'default' && (
            <span
              className={cn(
                'size-2.5 shrink-0 border-2 border-ink',
                tone === 'income' ? 'bg-income' : 'bg-expense'
              )}
              aria-hidden="true"
            />
          )}
          {label}
        </p>
        {change ? (
          <ChangeNote change={change} />
        ) : note ? (
          <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-faint">{note}</p>
        ) : null}
      </div>
      <p
        className={cn(
          'shrink-0 font-mono text-[15px] font-semibold tracking-[-0.03em] tabular-nums',
          tone === 'income' && 'text-income',
          tone === 'expense' && 'text-expense',
          tone === 'default' && 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  );
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, currency }) => {
  const {
    month,
    totalIncome,
    totalExpenses,
    monthlyBalance,
    isDeficit,
    dailyAverageExpense,
    daysElapsedInMonth,
    totalDaysInMonth,
    isCurrentMonth,
    expensePercentage,
    previousMonthComparison,
  } = summary;

  const periodText = isCurrentMonth
    ? `${getMonthName(month).slice(0, 3)} 1 to ${daysElapsedInMonth}`
    : `Full month, ${totalDaysInMonth} days`;

  const spentWidth = expensePercentage === null ? 0 : Math.min(100, expensePercentage);

  const incomeChange =
    previousMonthComparison?.incomeChangePercent !== null &&
    previousMonthComparison?.incomeChangePercent !== undefined
      ? {
          percent: previousMonthComparison.incomeChangePercent,
          amount: previousMonthComparison.incomeChangeAmount,
          favorable: previousMonthComparison.incomeChangeAmount >= 0,
        }
      : undefined;

  const expenseChange =
    previousMonthComparison?.expenseChangePercent !== null &&
    previousMonthComparison?.expenseChangePercent !== undefined
      ? {
          percent: previousMonthComparison.expenseChangePercent,
          amount: previousMonthComparison.expenseChangeAmount,
          favorable: previousMonthComparison.expenseChangeAmount <= 0,
        }
      : undefined;

  return (
    <section className="overflow-hidden rounded-none border-2 border-ink bg-surface shadow-brutal">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Balance statement */}
        <div className="bg-accent p-5 text-accent-ink sm:p-7">
          <p className="text-xs font-semibold">
            {isDeficit ? 'Shortfall this month' : 'Money left this month'}
          </p>
          <p
            className={cn(
              'mt-3 whitespace-nowrap font-display text-[clamp(2.2rem,4.6vw,3.5rem)] font-black leading-[0.9] tracking-[-0.06em] tabular-nums',
              isDeficit ? 'text-expense' : 'text-accent-ink'
            )}
          >
            {formatCurrency(monthlyBalance, currency)}
          </p>

          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-3 text-[11px] font-semibold">
              <span>
                {expensePercentage !== null
                  ? `${expensePercentage.toFixed(0)}% of income spent`
                  : 'No income recorded yet'}
              </span>
              <span className="font-mono tabular-nums">
                {expensePercentage !== null ? `${Math.min(100, expensePercentage).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-none border-2 border-accent-ink bg-accent-track">
              <div
                className={cn(
                  'h-full transition-[width] duration-500',
                  isDeficit ? 'bg-expense' : 'bg-accent-ink'
                )}
                style={{ width: `${spentWidth}%` }}
              />
            </div>
          </div>

          <p className="mt-4 max-w-md text-[11px] font-medium leading-relaxed text-accent-ink/70">
            Calculated from entries dated {periodText}. Previous month balances are not counted as
            income.
          </p>
        </div>

        {/* Supporting figures */}
        <dl className="border-t-2 border-ink lg:border-l-2 lg:border-t-0">
          <Metric
            label="Income"
            value={formatCurrency(totalIncome, currency)}
            tone="income"
            change={incomeChange}
          />
          <Metric
            label="Expenses"
            value={formatCurrency(totalExpenses, currency)}
            tone="expense"
            change={expenseChange}
          />
          <Metric
            label="Daily average"
            value={formatCurrency(dailyAverageExpense, currency)}
            note={
              isCurrentMonth
                ? `Across ${daysElapsedInMonth} days so far`
                : `Across ${totalDaysInMonth} days`
            }
          />
        </dl>
      </div>

      {isDeficit && (
        <div className="flex items-start gap-2.5 border-t-2 border-ink bg-expense-soft px-5 py-3 sm:px-6">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-expense" aria-hidden="true" />
          <p className="text-xs font-medium leading-relaxed text-ink">
            <span className="font-bold">
              Spending is {formatCurrency(Math.abs(monthlyBalance), currency)} above income this
              month.
            </span>{' '}
            Review the largest categories below or add any income you have not logged yet.
          </p>
        </div>
      )}
    </section>
  );
};
