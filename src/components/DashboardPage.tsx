/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Transaction, Category, MonthlySummary, UserSettings } from '../types/finance.ts';
import { MonthSelector } from './MonthSelector.tsx';
import { SummaryCards } from './SummaryCards.tsx';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart.tsx';
import { CategoryBreakdownChart } from './CategoryBreakdownChart.tsx';
import { RecentTransactionsList } from './RecentTransactionsList.tsx';
import {
  calculateCategoryBreakdown,
  filterTransactionsByMonth,
  formatCurrency,
} from '../utils/finance.ts';
import { Button, PageHeader, Panel, PanelHeader } from './ui.tsx';

interface DashboardPageProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
  summary: MonthlySummary;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onViewAllTransactions: () => void;
  onNavigateToCalendar: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  year,
  month,
  onMonthChange,
  transactions,
  categories,
  settings,
  summary,
  onEditTransaction,
  onDeleteTransaction,
  onViewAllTransactions,
  onNavigateToCalendar,
}) => {
  const monthTransactions = filterTransactionsByMonth(transactions, year, month);
  const categoryBreakdown = calculateCategoryBreakdown(monthTransactions, categories);
  const topCategory = summary.highestSpendingCategory;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Overview"
        description="A clear view of this month's income, spending, and what is left."
        actions={<MonthSelector year={year} month={month} onChange={onMonthChange} />}
      />

      <SummaryCards summary={summary} currency={settings.currency} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-5 lg:col-span-7 lg:space-y-6">
          <IncomeVsExpensesChart summary={summary} currency={settings.currency} />
          <RecentTransactionsList
            transactions={monthTransactions}
            categories={categories}
            currency={settings.currency}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
            onViewAll={onViewAllTransactions}
          />
        </div>

        <div className="space-y-5 lg:col-span-5 lg:space-y-6">
          <CategoryBreakdownChart
            items={categoryBreakdown}
            currency={settings.currency}
            totalExpense={summary.totalExpenses}
          />

          <Panel>
            <PanelHeader
              title="Month at a glance"
              description="A few numbers worth knowing."
            />

            <dl className="divide-y divide-rule">
              <div className="flex items-baseline justify-between gap-4 px-4 py-3.5 sm:px-5">
                <dt className="text-xs text-muted">Days elapsed</dt>
                <dd className="font-mono text-xs font-medium tabular-nums text-ink">
                  {summary.isCurrentMonth
                    ? `${summary.daysElapsedInMonth} of ${summary.totalDaysInMonth}`
                    : `${summary.totalDaysInMonth}`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 px-4 py-3.5 sm:px-5">
                <dt className="text-xs text-muted">Entries this month</dt>
                <dd className="font-mono text-xs font-medium tabular-nums text-ink">
                  {monthTransactions.length}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
                <dt className="text-xs text-muted">Largest expense</dt>
                <dd className="text-right">
                  {topCategory ? (
                    <>
                      <p className="text-xs font-medium text-ink">{topCategory.categoryName}</p>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted">
                        {formatCurrency(topCategory.amount, settings.currency)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-faint">None yet</p>
                  )}
                </dd>
              </div>
            </dl>

            <div className="border-t border-rule p-4">
              <Button
                variant="secondary"
                onClick={onNavigateToCalendar}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted" />
                  Open the calendar
                </span>
                <ChevronRight className="size-4 text-muted" />
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
