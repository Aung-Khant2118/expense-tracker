/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MonthlySummary } from '../types/finance.ts';
import { formatCurrency } from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import { Panel, PanelHeader, cn } from './ui.tsx';

interface IncomeVsExpensesChartProps {
  summary: MonthlySummary;
  currency: string;
}

interface FlowRowProps {
  label: string;
  amount: number;
  percent: number;
  tone: 'income' | 'expense';
  currency: string;
}

function FlowRow({ label, amount, percent, tone, currency }: FlowRowProps) {
  const width = amount > 0 ? Math.max(1, Math.min(100, percent)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <span
            className={cn(
              'size-3 shrink-0 border-2 border-ink',
              tone === 'income' ? 'bg-income' : 'bg-expense'
            )}
            aria-hidden="true"
          />
          {label}
        </span>
        <span
          className={cn(
            'font-mono text-sm font-semibold tabular-nums',
            tone === 'income' ? 'text-income' : 'text-expense'
          )}
        >
          {formatCurrency(amount, currency)}
        </span>
      </div>
      <div className="mt-2 h-4 overflow-hidden border-2 border-ink bg-surface">
        <div
          className={cn(
            'h-full transition-[width] duration-500 motion-reduce:transition-none',
            tone === 'income' ? 'bg-income' : 'bg-expense'
          )}
          style={{ width: `${width}%` }}
          role="img"
          aria-label={`${label}: ${formatCurrency(amount, currency)}`}
        />
      </div>
    </div>
  );
}

export const IncomeVsExpensesChart: React.FC<IncomeVsExpensesChartProps> = ({
  summary,
  currency,
}) => {
  const {
    totalIncome,
    totalExpenses,
    monthlyBalance,
    isDeficit,
    highestSpendingCategory,
  } = summary;

  const maxValue = Math.max(totalIncome, totalExpenses, 1);
  const incomePercent = (totalIncome / maxValue) * 100;
  const expensePercent = (totalExpenses / maxValue) * 100;

  const savingsRate =
    totalIncome > 0 && monthlyBalance > 0
      ? ((monthlyBalance / totalIncome) * 100).toFixed(1)
      : null;

  return (
    <Panel>
      <PanelHeader
        title="Cash flow"
        description="How income and spending compare this month."
        action={
          savingsRate ? (
            <div className="text-right">
              <p className="text-[11px] font-semibold text-muted">Savings rate</p>
              <p className="font-mono text-sm font-bold tabular-nums text-income">{savingsRate}%</p>
            </div>
          ) : undefined
        }
      />

      <div className="space-y-5 p-5">
        <FlowRow
          label="Income"
          amount={totalIncome}
          percent={incomePercent}
          tone="income"
          currency={currency}
        />
        <FlowRow
          label="Expenses"
          amount={totalExpenses}
          percent={expensePercent}
          tone="expense"
          currency={currency}
        />

        <div className="grid grid-cols-2 gap-5 border-t-2 border-ink pt-4">
          <div>
            <p className="text-[11px] font-semibold text-muted">
              {isDeficit ? 'Net shortfall' : 'Net remaining'}
            </p>
            <p
              className={cn(
                'mt-1 font-mono text-base font-bold tabular-nums',
                isDeficit ? 'text-expense' : 'text-ink'
              )}
            >
              {formatCurrency(monthlyBalance, currency)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted">Largest category</p>
            {highestSpendingCategory ? (
              <div className="mt-1 flex items-center gap-2">
                <CategoryAvatar
                  category={{
                    icon: highestSpendingCategory.categoryIcon,
                    color: highestSpendingCategory.categoryColor,
                  }}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">
                    {highestSpendingCategory.categoryName}
                  </p>
                  <p className="font-mono text-[11px] font-medium tabular-nums text-muted">
                    {highestSpendingCategory.percentage.toFixed(0)}% of expenses
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-faint">No expenses yet</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};
