/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  Transaction,
  Category,
  TransactionType,
  PaymentMethod,
  UserSettings,
} from '../types/finance.ts';
import { formatCurrency, formatDateShort, getMonthName, toISODate } from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import {
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  SegmentedControl,
  cn,
  inputClass,
  selectClass,
} from './ui.tsx';
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
type DateFilterMode = 'all' | 'month' | 'range';

const PAGE_SIZE = 15;

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'Mobile Wallet',
  'Credit Card',
  'Debit Card',
  'Other',
];

const TYPE_OPTIONS: Array<{ value: 'all' | TransactionType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
];

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  categories,
  settings,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    for (const tx of transactions) {
      const year = Number(tx.transactionDate.slice(0, 4));
      if (!Number.isNaN(year)) years.add(year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions
      .filter((tx) => {
        if (query) {
          const category = categoryMap.get(tx.categoryId);
          const matches =
            (tx.description || '').toLowerCase().includes(query) ||
            (category?.name || '').toLowerCase().includes(query) ||
            (tx.paymentMethod || '').toLowerCase().includes(query) ||
            tx.amount.toString().includes(query);

          if (!matches) return false;
        }

        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        if (paymentMethodFilter !== 'all' && tx.paymentMethod !== paymentMethodFilter) return false;

        if (dateFilterMode === 'month') {
          const prefix = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
          if (!tx.transactionDate.startsWith(prefix)) return false;
        } else if (dateFilterMode === 'range') {
          if (startDate && tx.transactionDate < startDate) return false;
          if (endDate && tx.transactionDate > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
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
    categoryMap,
  ]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }

    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    dateFilterMode !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  const advancedFilterCount = [
    categoryFilter !== 'all',
    paymentMethodFilter !== 'all',
    dateFilterMode !== 'all',
  ].filter(Boolean).length;

  const resetPage = () => setCurrentPage(1);

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(filteredTransactions, categories);
    triggerDownload(csv, `ledger-transactions-${toISODate()}.csv`, 'text/csv');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setDateFilterMode('all');
    setStartDate('');
    setEndDate('');
    resetPage();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Transactions"
        description="Every recorded income and expense, with the tools to find what you need."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
            >
              <Download className="size-4" />
              <span>Export CSV</span>
            </Button>
            <Button variant="primary" onClick={onOpenAddModal}>
              <Plus className="size-4 stroke-[2.5]" />
              <span>Add transaction</span>
            </Button>
          </>
        }
      />

      <Panel className="overflow-hidden">
        {/* Search and filters */}
        <div className="border-b border-rule p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <label htmlFor="transaction-search" className="sr-only">
                Search transactions
              </label>
              <input
                id="transaction-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                placeholder="Search notes, categories, amounts…"
                className={cn(inputClass, 'pl-9')}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SegmentedControl
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  resetPage();
                }}
                options={TYPE_OPTIONS}
                ariaLabel="Filter by transaction type"
              />

              <Button
                variant="secondary"
                onClick={() => setShowFilters((previous) => !previous)}
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
                className="self-start md:hidden"
              >
                <SlidersHorizontal className="size-4" />
                <span>Filters</span>
                {advancedFilterCount > 0 && (
                  <span className="grid size-4 place-items-center rounded-full bg-ink font-mono text-[10px] tabular-nums text-canvas">
                    {advancedFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div
            id="advanced-filters"
            className={cn('mt-3 space-y-3', showFilters ? 'block' : 'hidden md:block')}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="filter-category"
                className="mb-1.5 block text-[11px] font-medium text-muted"
              >
                Category
              </label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-payment"
                className="mb-1.5 block text-[11px] font-medium text-muted"
              >
                Payment method
              </label>
              <select
                id="filter-payment"
                value={paymentMethodFilter}
                onChange={(event) => {
                  setPaymentMethodFilter(event.target.value);
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-period"
                className="mb-1.5 block text-[11px] font-medium text-muted"
              >
                Period
              </label>
              <select
                id="filter-period"
                value={dateFilterMode}
                onChange={(event) => {
                  setDateFilterMode(event.target.value as DateFilterMode);
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All time</option>
                <option value="month">A specific month</option>
                <option value="range">A date range</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-sort"
                className="mb-1.5 block text-[11px] font-medium text-muted"
              >
                Sort by
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortField)}
                className={selectClass}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Highest amount</option>
                <option value="amount-asc">Lowest amount</option>
              </select>
            </div>
            </div>

          {dateFilterMode === 'month' && (
            <div className="grid max-w-md grid-cols-2 gap-3 rounded-lg border border-rule bg-surface-2/40 p-3">
              <div>
                <label
                  htmlFor="filter-month"
                  className="mb-1.5 block text-[11px] font-medium text-muted"
                >
                  Month
                </label>
                <select
                  id="filter-month"
                  value={filterMonth}
                  onChange={(event) => {
                    setFilterMonth(parseInt(event.target.value, 10));
                    resetPage();
                  }}
                  className={selectClass}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-year"
                  className="mb-1.5 block text-[11px] font-medium text-muted"
                >
                  Year
                </label>
                <select
                  id="filter-year"
                  value={filterYear}
                  onChange={(event) => {
                    setFilterYear(parseInt(event.target.value, 10));
                    resetPage();
                  }}
                  className={selectClass}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {dateFilterMode === 'range' && (
            <div className="grid max-w-lg grid-cols-1 gap-3 rounded-lg border border-rule bg-surface-2/40 p-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="mb-1.5 block text-[11px] font-medium text-muted"
                >
                  From
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    resetPage();
                  }}
                  className={cn(inputClass, 'font-mono text-xs')}
                />
              </div>

              <div>
                <label
                  htmlFor="filter-end-date"
                  className="mb-1.5 block text-[11px] font-medium text-muted"
                >
                  To
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    resetPage();
                  }}
                  className={cn(inputClass, 'font-mono text-xs')}
                />
              </div>
            </div>
          )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <p className="text-muted">
              Showing{' '}
              <span className="font-mono font-medium tabular-nums text-ink">
                {filteredTransactions.length}
              </span>{' '}
              of{' '}
              <span className="font-mono tabular-nums text-ink">{transactions.length}</span>{' '}
              transactions
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-md font-medium text-muted transition-colors hover:text-ink"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Totals for the current result set */}
        <div className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
          <div className="px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="text-[10px] text-muted sm:text-[11px]">Income shown</p>
            <p className="mt-1 truncate font-mono text-[11px] font-medium tabular-nums text-income sm:text-sm">
              {filteredTotals.income > 0 ? '+' : ''}
              {formatCurrency(filteredTotals.income, settings.currency)}
            </p>
          </div>
          <div className="px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="text-[10px] text-muted sm:text-[11px]">Expenses shown</p>
            <p className="mt-1 truncate font-mono text-[11px] font-medium tabular-nums text-expense sm:text-sm">
              {filteredTotals.expense > 0 ? '-' : ''}
              {formatCurrency(filteredTotals.expense, settings.currency)}
            </p>
          </div>
          <div className="px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="text-[10px] text-muted sm:text-[11px]">Net</p>
            <p
              className={cn(
                'mt-1 truncate font-mono text-[11px] font-medium tabular-nums sm:text-sm',
                filteredTotals.balance < 0 ? 'text-expense' : 'text-ink'
              )}
            >
              {formatCurrency(filteredTotals.balance, settings.currency)}
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="No transactions found"
            description={
              hasActiveFilters
                ? 'Try a different search, or clear the filters to see the full ledger.'
                : 'Your ledger is empty. Add the first income or expense to get started.'
            }
            action={
              hasActiveFilters ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button variant="secondary" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                  <Button variant="primary" onClick={onOpenAddModal}>
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>Add transaction</span>
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={onOpenAddModal}>
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Add transaction</span>
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule text-[11px] font-medium text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium lg:px-5">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Note
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Payment
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium lg:px-5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {paginatedTransactions.map((tx) => {
                    const category = categoryMap.get(tx.categoryId);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr key={tx.id} className="transition-colors hover:bg-surface-2/50">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] tabular-nums text-muted lg:px-5">
                          {formatDateShort(tx.transactionDate)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <CategoryAvatar category={category} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-ink">
                                {category?.name || 'Uncategorized'}
                              </p>
                              <p className="text-[10px] capitalize text-faint">{tx.type}</p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[260px] px-4 py-3">
                          {tx.description ? (
                            <span className="block truncate text-xs text-muted">{tx.description}</span>
                          ) : (
                            <span className="text-xs text-faint">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted">
                          {tx.paymentMethod || '—'}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span
                            className={cn(
                              'font-mono text-xs font-medium tabular-nums',
                              isIncome ? 'text-income' : 'text-expense'
                            )}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, settings.currency)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton
                              label={`Edit ${category?.name || 'transaction'}`}
                              onClick={() => onEditTransaction(tx)}
                              className="size-8 text-faint hover:text-ink"
                            >
                              <Edit2 className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label={`Delete ${category?.name || 'transaction'}`}
                              onClick={() => onDeleteTransaction(tx)}
                              className="size-8 text-faint hover:bg-expense-soft hover:text-expense"
                            >
                              <Trash2 className="size-3.5" />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-rule md:hidden">
              {paginatedTransactions.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <li key={tx.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CategoryAvatar category={category} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {category?.name || 'Uncategorized'}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted">
                              <span className="font-mono tabular-nums">
                                {formatDateShort(tx.transactionDate)}
                              </span>
                              {tx.description ? ` · ${tx.description}` : ''}
                            </p>
                          </div>

                          <span
                            className={cn(
                              'shrink-0 font-mono text-xs font-medium tabular-nums',
                              isIncome ? 'text-income' : 'text-expense'
                            )}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, settings.currency)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-faint">
                            {tx.paymentMethod || 'No payment method'}
                          </span>

                          <div className="flex items-center gap-0.5">
                            <IconButton
                              label={`Edit ${category?.name || 'transaction'}`}
                              onClick={() => onEditTransaction(tx)}
                              className="size-8 text-faint hover:text-ink"
                            >
                              <Edit2 className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label={`Delete ${category?.name || 'transaction'}`}
                              onClick={() => onDeleteTransaction(tx)}
                              className="size-8 text-faint hover:bg-expense-soft hover:text-expense"
                            >
                              <Trash2 className="size-3.5" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 sm:px-5">
              <p className="text-[11px] text-muted">
                {startIndex + 1}–
                <span className="font-mono tabular-nums">
                  {Math.min(startIndex + PAGE_SIZE, filteredTransactions.length)}
                </span>{' '}
                of{' '}
                <span className="font-mono tabular-nums">
                  {filteredTransactions.length}
                </span>
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <span className="px-1.5 font-mono text-[11px] tabular-nums text-muted">
                  {page} / {totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};
