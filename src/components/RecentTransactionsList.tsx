/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, Edit2, ReceiptText, Trash2 } from 'lucide-react';
import { Transaction, Category } from '../types/finance.ts';
import { formatCurrency, formatDateShort } from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import { Button, EmptyState, IconButton, Panel, PanelHeader, cn } from './ui.tsx';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onViewAll: () => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
  categories,
  currency,
  onEdit,
  onDelete,
  onViewAll,
}) => {
  const categoryMap = new Map<string, Category>(categories.map((category) => [category.id, category]));

  const recent = [...transactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 6);

  return (
    <Panel>
      <PanelHeader
        title="Recent activity"
        description="The latest entries this month."
        action={
          <Button variant="quiet" size="sm" onClick={onViewAll} className="gap-1">
            <span>View all</span>
            <ChevronRight className="size-3.5" />
          </Button>
        }
      />

      {recent.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-5" />}
          title="No entries this month"
          description="Add your first income or expense to start building the month's picture."
        />
      ) : (
        <ul className="divide-y divide-rule">
          {recent.map((tx) => {
            const category = categoryMap.get(tx.categoryId);
            const isIncome = tx.type === 'income';

            return (
              <li
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50 sm:px-5"
              >
                <CategoryAvatar category={category} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="truncate text-sm font-medium text-ink">
                      {category?.name || 'Uncategorized'}
                    </span>
                    {tx.paymentMethod && (
                      <span className="text-[10px] text-faint">{tx.paymentMethod}</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    <span className="font-mono tabular-nums">
                      {formatDateShort(tx.transactionDate)}
                    </span>
                    {tx.description ? `, ${tx.description}` : ''}
                  </p>
                </div>

                <span
                  className={cn(
                    'shrink-0 font-mono text-xs font-medium tabular-nums sm:text-sm',
                    isIncome ? 'text-income' : 'text-expense'
                  )}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label="Edit transaction"
                    onClick={() => onEdit(tx)}
                    className="size-8 text-faint hover:text-ink"
                  >
                    <Edit2 className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Delete transaction"
                    onClick={() => onDelete(tx)}
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
  );
};
