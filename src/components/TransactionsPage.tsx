/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Category,
  TransactionType,
  PaymentMethod,
  UserSettings,
} from '../types/finance.ts';
import { formatCurrency, getMonthName } from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { exportTransactionsToCSV, triggerDownload } from '../services/storage.ts';

interface TransactionsPageProps {
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

type SortField = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  categories,
  settings,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'month' | 'range'>('all');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Unique payment methods
  const paymentMethods: PaymentMethod[] = [
    'Cash',
    'Bank Transfer',
    'Mobile Wallet',
    'Credit Card',
    'Debit Card',
    'Other',
  ];

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cat = catMap.get(tx.categoryId);
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (cat?.name || '').toLowerCase().includes(query);
        const methodMatch = (tx.paymentMethod || '').toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        if (!descMatch && !catMatch && !methodMatch && !amountMatch) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }

      // Payment method filter
      if (paymentMethodFilter !== 'all' && tx.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Date mode filter
      if (dateFilterMode === 'month') {
        const prefix = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
        if (!tx.transactionDate.startsWith(prefix)) return false;
      } else if (dateFilterMode === 'range') {
        if (startDate && tx.transactionDate < startDate) return false;
        if (endDate && tx.transactionDate > endDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.transactionDate.localeCompare(a.transactionDate);
      if (sortBy === 'date-asc') return a.transactionDate.localeCompare(b.transactionDate);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    paymentMethodFilter,
    dateFilterMode,
    filterYear,
    filterMonth,
    startDate,
    endDate,
    sortBy,
    catMap,
  ]);

  // Totals for filtered set
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(filteredTransactions, categories);
    const dateStamp = new Date().toISOString().split('T')[0];
    triggerDownload(csv, `expense_transactions_${dateStamp}.csv`, 'text/csv');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setDateFilterMode('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    dateFilterMode !== 'all';

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Transaction History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Browse, search, filter, and audit all recorded income and expense logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        {/* Search input + Segmented Type Switch */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, category, or payment method..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setTypeFilter('income');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Income Only
            </button>
            <button
              onClick={() => {
                setTypeFilter('expense');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Expenses Only
            </button>
          </div>
        </div>

        {/* Second Row: Detailed Dropdowns & Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Mode */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Date Period</label>
            <select
              value={dateFilterMode}
              onChange={(e) => {
                setDateFilterMode(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="month">Specific Month</option>
              <option value="range">Custom Date Range</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Date Mode Conditional Inputs */}
        {dateFilterMode === 'month' && (
          <div className="flex items-center gap-3 pt-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Select Month:</span>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {dateFilterMode === 'range' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
            />
          </div>
        )}

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtered Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filtered Income</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatCurrency(filteredTotals.income, settings.currency)}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filtered Expenses</span>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            -{formatCurrency(filteredTotals.expense, settings.currency)}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filtered Net Balance</span>
          <div className={`text-lg font-bold font-mono tabular-nums ${
            filteredTotals.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
          }`}>
            {formatCurrency(filteredTotals.balance, settings.currency)}
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No matching transactions
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, removing filters, or log a new transaction.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransactions.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.transactionDate}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: cat?.color || '#94a3b8' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Receipt'} size={12} color="#ffffff" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {cat?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {tx.description || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.paymentMethod || '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit transaction"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx)}
                            title="Delete transaction"
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Page {currentPage} of {totalPages} ({filteredTransactions.length} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
