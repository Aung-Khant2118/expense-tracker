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
        'mt-2 flex items-center gap-1 text-[11px]',
        change.favorable ? 'text-income' : 'text-expense'
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="font-mono font-medium tabular-nums">
        {Math.abs(change.percent).toFixed(1)}%
      </span>
      <span className="text-muted">vs last month</span>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  tone?: 'default' | 'income' | 'expense';
  note?: string;
  change?: Change;
  className?: string;
}

function Metric({ label, value, tone = 'default', note, change, className }: MetricProps) {
  return (
    <div className={cn('min-w-0 p-4 sm:p-5', className)}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          'mt-2 font-mono text-xl font-medium tracking-tight tabular-nums',
          tone === 'income' && 'text-income',
          tone === 'expense' && 'text-expense',
          tone === 'default' && 'text-ink'
        )}
      >
        {value}
      </p>
      {change ? <ChangeNote change={change} /> : note ? <p className="mt-2 text-[11px] text-faint">{note}</p> : null}
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
    <section className="overflow-hidden rounded-xl border border-rule bg-surface">
      <div className="grid xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.65fr)]">
        {/* Balance */}
        <div className="border-b border-rule p-4 sm:p-6 xl:border-b-0 xl:border-r">
          <p className="text-xs font-medium text-muted">
            {isDeficit ? 'Shortfall this month' : 'Money left this month'}
          </p>
          <p
            className={cn(
              'mt-2 font-display text-[38px] font-semibold leading-none tracking-tight tabular-nums sm:text-[46px]',
              isDeficit ? 'text-expense' : 'text-ink'
            )}
          >
            {formatCurrency(monthlyBalance, currency)}
          </p>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3 text-[11px]">
              <span className="text-muted">
                {expensePercentage !== null
                  ? `${expensePercentage.toFixed(0)}% of income spent`
                  : 'No income recorded yet'}
              </span>
              <span className="font-mono tabular-nums text-faint">
                {expensePercentage !== null ? `${Math.min(100, expensePercentage).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-500',
                  isDeficit
                    ? 'bg-expense'
                    : expensePercentage !== null && expensePercentage > 85
                      ? 'bg-accent'
                      : 'bg-income'
                )}
                style={{ width: `${spentWidth}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Calculated from entries dated {periodText}. Previous month balances are not counted as
            income.
          </p>
        </div>

        {/* Supporting figures */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3">
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
            className="border-t border-rule min-[380px]:border-l min-[380px]:border-t-0"
          />
          <Metric
            label="Daily average"
            value={formatCurrency(dailyAverageExpense, currency)}
            note={isCurrentMonth ? `Across ${daysElapsedInMonth} days so far` : `Across ${totalDaysInMonth} days`}
            className="col-span-full border-t border-rule sm:col-span-1 sm:border-l sm:border-t-0"
          />
        </div>
      </div>

      {isDeficit && (
        <div className="flex items-start gap-2.5 border-t border-expense/20 bg-expense-soft/60 px-5 py-3 sm:px-6">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-expense" />
          <p className="text-xs leading-relaxed text-expense">
            <span className="font-semibold">
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
