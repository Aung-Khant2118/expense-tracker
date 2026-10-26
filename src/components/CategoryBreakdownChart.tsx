/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieChart } from 'lucide-react';
import { CategoryBreakdownItem } from '../types/finance.ts';
import { formatCurrency } from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import { EmptyState, Panel, PanelHeader } from './ui.tsx';

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
      <Panel className="flex min-h-[300px] flex-col">
        <PanelHeader title="Where it went" description="Spending by category." />
        <EmptyState
          className="flex-1"
          icon={<PieChart className="size-5" />}
          title="No expenses this month"
          description="Add an expense to see how your spending is distributed."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Where it went"
        description="Spending by category."
        action={
          <div className="text-right">
            <p className="text-[10px] text-muted">Total spent</p>
            <p className="font-mono text-xs font-medium tabular-nums text-ink">
              {formatCurrency(totalExpense, currency)}
            </p>
          </div>
        }
      />

      <div className="p-5">
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-surface-2"
          role="img"
          aria-label={`Expense distribution across ${items.length} categories`}
        >
          {items.map((item) => (
            <div
              key={item.categoryId}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              title={`${item.categoryName}: ${item.percentage.toFixed(1)}%`}
            />
          ))}
        </div>

        <ul className="mt-4 max-h-[290px] divide-y divide-rule overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.categoryId} className="flex items-center gap-3 py-3">
              <CategoryAvatar category={item} size="sm" />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-xs font-medium text-ink">{item.categoryName}</span>
                  <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-ink">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-muted">
                  <span>
                    {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
                  </span>
                  <span className="font-mono tabular-nums">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
};
