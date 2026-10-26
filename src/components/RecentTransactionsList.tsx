/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction, Category } from '../types/finance.ts';
import { formatCurrency } from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import { Edit2, Trash2, ArrowRight } from 'lucide-react';

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
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Sort newest first, top 6
  const recent = [...transactions]
    .sort((a, b) => (b.transactionDate > a.transactionDate ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Latest entries for this month
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <span>View All ({transactions.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No transactions found for this month.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((tx) => {
            const cat = catMap.get(tx.categoryId);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat?.color || '#94a3b8' }}
                  >
                    <CategoryIcon name={cat?.icon || 'Receipt'} size={18} color="#ffffff" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cat?.name || 'Uncategorized'}
                      </span>
                      {tx.paymentMethod && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          · {tx.paymentMethod}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <span>{tx.transactionDate}</span>
                      {tx.description && <span> · {tx.description}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(tx)}
                      aria-label="Edit transaction"
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      aria-label="Delete transaction"
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
