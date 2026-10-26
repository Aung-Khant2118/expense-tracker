/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Category, DailyActivity, Transaction, UserSettings } from '../types/finance.ts';
import {
  calculateCategoryBreakdown,
  calculateDailyActivity,
  calculateMonthlySummary,
  filterTransactionsByMonth,
  formatCurrency,
  getMonthName,
  getShortMonthName,
} from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import { EmptyState, PageHeader, Panel, PanelHeader, cn } from './ui.tsx';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
}

interface TrendPoint {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  balance: number;
}

const inlineSelectClass =
  'h-9 cursor-pointer rounded-lg border border-rule-strong bg-surface px-2.5 text-xs font-medium text-ink';

const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

/**
 * Keeps SVG charts at a 1:1 unit-to-pixel scale so labels stay legible.
 */
function useChartWidth(fallback = 720) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(Math.max(280, Math.round(next)));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { containerRef, width };
}

/* ------------------------------------------------------------------ */
/*  Charts                                                             */
/* ------------------------------------------------------------------ */

function AnnualTrendChart({
  data,
  year,
  currency,
}: {
  data: TrendPoint[];
  year: number;
  currency: string;
}) {
  const { containerRef, width } = useChartWidth();
  const height = width < 480 ? 210 : 230;
  const padding = { top: 16, right: 12, bottom: 28, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...data.flatMap((point) => [point.income, point.expenses]));
  const baseY = padding.top + innerHeight;

  const x = (index: number) => padding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const y = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight;

  const pathFor = (pick: (point: TrendPoint) => number) =>
    data
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(pick(point)).toFixed(1)}`
      )
      .join(' ');

  const incomePath = pathFor((point) => point.income);
  const expensePath = pathFor((point) => point.expenses);
  const expenseArea = `${expensePath} L${x(data.length - 1).toFixed(1)},${baseY} L${x(
    0
  ).toFixed(1)},${baseY} Z`;

  const totalIncome = data.reduce((sum, point) => sum + point.income, 0);
  const totalExpenses = data.reduce((sum, point) => sum + point.expenses, 0);

  return (
    <div ref={containerRef}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-income" aria-hidden="true" />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-expense" aria-hidden="true" />
          Expenses
        </span>
        <span className="ml-auto font-mono text-[10px] text-faint">Amounts in {currency}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Monthly income and expenses for ${year}. Total income ${formatCurrency(
          totalIncome,
          currency
        )}, total expenses ${formatCurrency(totalExpenses, currency)}.`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = maxValue * fraction;
          const lineY = y(value);

          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={lineY}
                y2={lineY}
                style={{ stroke: 'var(--chart-grid)' }}
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={lineY + 3}
                textAnchor="end"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                style={{ fill: 'var(--faint)' }}
              >
                {compactNumber(value)}
              </text>
            </g>
          );
        })}

        <path d={expenseArea} style={{ fill: 'var(--expense)', opacity: 0.07 }} />

        <path
          d={incomePath}
          fill="none"
          style={{ stroke: 'var(--income)' }}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={expensePath}
          fill="none"
          style={{ stroke: 'var(--expense)' }}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {data.map((point, index) => (
          <g key={point.month}>
            <circle
              cx={x(index)}
              cy={y(point.income)}
              r="2.5"
              style={{ fill: 'var(--income)' }}
            >
              <title>
                {`${getMonthName(point.month)} ${year}: income ${formatCurrency(
                  point.income,
                  currency
                )}`}
              </title>
            </circle>
            <circle
              cx={x(index)}
              cy={y(point.expenses)}
              r="2.5"
              style={{ fill: 'var(--expense)' }}
            >
              <title>
                {`${getMonthName(point.month)} ${year}: expenses ${formatCurrency(
                  point.expenses,
                  currency
                )}`}
              </title>
            </circle>
            <text
              x={x(index)}
              y={height - 7}
              textAnchor="middle"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              style={{ fill: 'var(--faint)' }}
            >
              {point.monthName}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={baseY}
          y2={baseY}
          style={{ stroke: 'var(--rule-strong)' }}
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function CumulativeChart({
  data,
  currency,
  monthLabel,
}: {
  data: DailyActivity[];
  currency: string;
  monthLabel: string;
}) {
  const { containerRef, width } = useChartWidth();
  const height = 180;
  const padding = { top: 14, right: 12, bottom: 26, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const lastIndex = Math.max(0, data.length - 1);
  const maxValue = Math.max(1, ...data.map((day) => day.cumulativeExpense));
  const baseY = padding.top + innerHeight;

  const x = (index: number) =>
    padding.left + (index / Math.max(1, lastIndex)) * innerWidth;
  const y = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight;

  const line = data
    .map(
      (day, index) =>
        `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(day.cumulativeExpense).toFixed(1)}`
    )
    .join(' ');
  const area = `${line} L${x(lastIndex).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;
  const finalTotal = data[lastIndex]?.cumulativeExpense ?? 0;
  const tickIndexes = Array.from(
    new Set([0, Math.floor(lastIndex / 2), lastIndex])
  );

  return (
    <div ref={containerRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Cumulative expenses for ${monthLabel}, ending at ${formatCurrency(
          finalTotal,
          currency
        )} after ${data.length} days.`}
      >
      {[0, 0.5, 1].map((fraction) => {
        const value = maxValue * fraction;
        const lineY = y(value);

        return (
          <g key={fraction}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={lineY}
              y2={lineY}
              style={{ stroke: 'var(--chart-grid)' }}
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={lineY + 3}
              textAnchor="end"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              style={{ fill: 'var(--faint)' }}
            >
              {compactNumber(value)}
            </text>
          </g>
        );
      })}

      <path d={area} style={{ fill: 'var(--expense)', opacity: 0.09 }} />
      <path
        d={line}
        fill="none"
        style={{ stroke: 'var(--expense)' }}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      <circle
        cx={x(lastIndex)}
        cy={y(finalTotal)}
        r="3"
        style={{ fill: 'var(--expense)' }}
      />

      {tickIndexes.map((index) => (
        <text
          key={index}
          x={x(index)}
          y={height - 7}
          textAnchor={index === 0 ? 'start' : index === lastIndex ? 'end' : 'middle'}
          fontSize="10"
          fontFamily="ui-monospace, monospace"
          style={{ fill: 'var(--faint)' }}
        >
          {index === 0 ? 'Day 1' : `Day ${index + 1}`}
        </text>
      ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small comparison pieces                                            */
/* ------------------------------------------------------------------ */

function ChangeBadge({
  delta,
  increaseIsGood,
  currency,
}: {
  delta: number;
  increaseIsGood: boolean;
  currency: string;
}) {
  if (delta === 0) {
    return (
      <span className="font-mono text-[11px] tabular-nums text-faint">
        {formatCurrency(0, currency)}
      </span>
    );
  }

  const favorable = (delta > 0) === increaseIsGood;
  const Icon = delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-end gap-0.5 font-mono text-[11px] font-medium tabular-nums',
        favorable ? 'text-income' : 'text-expense'
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {delta > 0 ? '+' : ''}
      {formatCurrency(delta, currency)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export const ReportsPage: React.FC<ReportsPageProps> = ({
  transactions,
  categories,
  settings,
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [compareMonthA, setCompareMonthA] = useState<number>(currentMonth);
  const [compareYearA, setCompareYearA] = useState<number>(currentYear);
  const [compareMonthB, setCompareMonthB] = useState<number>(
    currentMonth === 1 ? 12 : currentMonth - 1
  );
  const [compareYearB, setCompareYearB] = useState<number>(
    currentMonth === 1 ? currentYear - 1 : currentYear
  );
  const [trendYear, setTrendYear] = useState<number>(currentYear);

  const yearOptions = useMemo(() => {
    const years = new Set<number>([
      currentYear,
      currentYear - 1,
      trendYear,
      compareYearA,
      compareYearB,
    ]);

    for (const tx of transactions) {
      const year = Number(tx.transactionDate.slice(0, 4));
      if (!Number.isNaN(year)) years.add(year);
    }

    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear, trendYear, compareYearA, compareYearB]);

  const monthlyTrends = useMemo<TrendPoint[]>(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const summary = calculateMonthlySummary(transactions, categories, trendYear, month);

      return {
        month,
        monthName: getShortMonthName(month),
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        balance: summary.monthlyBalance,
      };
    });
  }, [transactions, categories, trendYear]);

  const yearTotals = useMemo(() => {
    const income = monthlyTrends.reduce((sum, point) => sum + point.income, 0);
    const expenses = monthlyTrends.reduce((sum, point) => sum + point.expenses, 0);
    const surplusMonths = monthlyTrends.filter((point) => point.balance > 0).length;

    return { income, expenses, net: income - expenses, surplusMonths };
  }, [monthlyTrends]);

  const summaryA = useMemo(
    () => calculateMonthlySummary(transactions, categories, compareYearA, compareMonthA),
    [transactions, categories, compareYearA, compareMonthA]
  );

  const summaryB = useMemo(
    () => calculateMonthlySummary(transactions, categories, compareYearB, compareMonthB),
    [transactions, categories, compareYearB, compareMonthB]
  );

  const txA = useMemo(
    () => filterTransactionsByMonth(transactions, compareYearA, compareMonthA),
    [transactions, compareYearA, compareMonthA]
  );

  const txB = useMemo(
    () => filterTransactionsByMonth(transactions, compareYearB, compareMonthB),
    [transactions, compareYearB, compareMonthB]
  );

  const breakdownA = useMemo(() => calculateCategoryBreakdown(txA, categories), [txA, categories]);
  const breakdownB = useMemo(() => calculateCategoryBreakdown(txB, categories), [txB, categories]);

  const categoryComparisonRows = useMemo(() => {
    const map = new Map<string, { category: Category; amountA: number; amountB: number }>();

    for (const category of categories.filter((entry) => entry.type === 'expense')) {
      map.set(category.id, { category, amountA: 0, amountB: 0 });
    }

    for (const item of breakdownA) {
      const row = map.get(item.categoryId);
      if (row) row.amountA = item.amount;
    }

    for (const item of breakdownB) {
      const row = map.get(item.categoryId);
      if (row) row.amountB = item.amount;
    }

    return Array.from(map.values())
      .filter((row) => row.amountA > 0 || row.amountB > 0)
      .sort((a, b) => b.amountA - a.amountA);
  }, [categories, breakdownA, breakdownB]);

  const dailyActivityA = useMemo(
    () => calculateDailyActivity(transactions, compareYearA, compareMonthA),
    [transactions, compareYearA, compareMonthA]
  );

  const labelA = `${getMonthName(compareMonthA)} ${compareYearA}`;
  const shortLabelA = `${getShortMonthName(compareMonthA)} ${compareYearA}`;
  const shortLabelB = `${getShortMonthName(compareMonthB)} ${compareYearB}`;

  const comparisonRows = [
    {
      label: 'Income',
      a: summaryA.totalIncome,
      b: summaryB.totalIncome,
      increaseIsGood: true,
    },
    {
      label: 'Expenses',
      a: summaryA.totalExpenses,
      b: summaryB.totalExpenses,
      increaseIsGood: false,
    },
    {
      label: 'Net',
      a: summaryA.monthlyBalance,
      b: summaryB.monthlyBalance,
      increaseIsGood: true,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Reports"
        description="Step back from individual entries to see the year and compare two months."
      />

      {/* Annual trend */}
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Annual cash flow"
          description="Income and expenses for each month of the year."
          action={
            <label className="inline-flex items-center gap-2 text-[11px] text-muted">
              <span>Year</span>
              <select
                value={trendYear}
                onChange={(event) => setTrendYear(parseInt(event.target.value, 10))}
                className={inlineSelectClass}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          }
        />

        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
          <div className="flex items-baseline gap-2">
            <dt className="text-[11px] text-muted">Income</dt>
            <dd className="font-mono text-xs font-medium tabular-nums text-income">
              {formatCurrency(yearTotals.income, settings.currency)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[11px] text-muted">Expenses</dt>
            <dd className="font-mono text-xs font-medium tabular-nums text-expense">
              {formatCurrency(yearTotals.expenses, settings.currency)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[11px] text-muted">Net</dt>
            <dd
              className={cn(
                'font-mono text-xs font-medium tabular-nums',
                yearTotals.net < 0 ? 'text-expense' : 'text-ink'
              )}
            >
              {formatCurrency(yearTotals.net, settings.currency)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[11px] text-muted">Months in surplus</dt>
            <dd className="font-mono text-xs font-medium tabular-nums text-ink">
              {yearTotals.surplusMonths} of 12
            </dd>
          </div>
        </dl>

        <div className="p-4 sm:p-5">
          <AnnualTrendChart
            data={monthlyTrends}
            year={trendYear}
            currency={settings.currency}
          />
        </div>
      </Panel>

      {/* Month comparison */}
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Compare two months"
          description="See how one month differs from another, in totals and by category."
        />

        <div className="grid gap-3 border-b border-rule p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:p-5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-ink">Primary month</p>
            <div className="grid grid-cols-[1fr_5.5rem] gap-2">
              <label className="block">
                <span className="sr-only">Primary month</span>
                <select
                  value={compareMonthA}
                  onChange={(event) => setCompareMonthA(parseInt(event.target.value, 10))}
                  className={cn(inlineSelectClass, 'w-full')}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Primary year</span>
                <select
                  value={compareYearA}
                  onChange={(event) => setCompareYearA(parseInt(event.target.value, 10))}
                  className={cn(inlineSelectClass, 'w-full')}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="hidden pb-2.5 text-faint sm:block" aria-hidden="true">
            <ArrowRight className="size-4" />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-medium text-ink">Comparison month</p>
            <div className="grid grid-cols-[1fr_5.5rem] gap-2">
              <label className="block">
                <span className="sr-only">Comparison month</span>
                <select
                  value={compareMonthB}
                  onChange={(event) => setCompareMonthB(parseInt(event.target.value, 10))}
                  className={cn(inlineSelectClass, 'w-full')}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Comparison year</span>
                <select
                  value={compareYearB}
                  onChange={(event) => setCompareYearB(parseInt(event.target.value, 10))}
                  className={cn(inlineSelectClass, 'w-full')}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Mobile: stacked comparison */}
        <ul className="divide-y divide-rule md:hidden">
          {comparisonRows.map((row) => (
            <li key={row.label} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-ink">{row.label}</span>
                <span className="font-mono text-xs font-medium tabular-nums text-ink">
                  {formatCurrency(row.a, settings.currency)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px] text-muted">
                <span>
                  vs{' '}
                  <span className="font-mono tabular-nums">
                    {formatCurrency(row.b, settings.currency)}
                  </span>{' '}
                  in {shortLabelB}
                </span>
                <ChangeBadge
                  delta={row.a - row.b}
                  increaseIsGood={row.increaseIsGood}
                  currency={settings.currency}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-rule text-[11px] text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                  Figure
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="block text-[10px] font-normal text-faint">Primary</span>
                  {shortLabelA}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="block text-[10px] font-normal text-faint">Comparison</span>
                  {shortLabelB}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-2.5 text-xs font-medium text-ink sm:px-5">
                    {row.label}
                  </th>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs font-medium tabular-nums text-ink">
                    {formatCurrency(row.a, settings.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted">
                    {formatCurrency(row.b, settings.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right sm:px-5">
                    <ChangeBadge
                      delta={row.a - row.b}
                      increaseIsGood={row.increaseIsGood}
                      currency={settings.currency}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-rule">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
            <h3 className="font-display text-[13px] font-semibold tracking-tight text-ink">
              Spending by category
            </h3>
            <p className="text-[10px] text-faint">Change is primary minus comparison</p>
          </div>

          {categoryComparisonRows.length === 0 ? (
            <EmptyState
              title="No spending in either month"
              description="Once expenses exist in these months, the category comparison appears here."
            />
          ) : (
            <>
              <ul className="divide-y divide-rule border-t border-rule md:hidden">
                {categoryComparisonRows.map((row) => (
                  <li key={row.category.id} className="flex items-center gap-3 px-4 py-3">
                    <CategoryAvatar category={row.category} size="sm" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-xs font-medium text-ink">
                          {row.category.name}
                        </p>
                        <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-ink">
                          {formatCurrency(row.amountA, settings.currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px] text-muted">
                        <span>
                          vs{' '}
                          <span className="font-mono tabular-nums">
                            {formatCurrency(row.amountB, settings.currency)}
                          </span>{' '}
                          in {shortLabelB}
                        </span>
                        <ChangeBadge
                          delta={row.amountA - row.amountB}
                          increaseIsGood={false}
                          currency={settings.currency}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto border-t border-rule md:block">
                <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule text-[11px] text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      {shortLabelA}
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      {shortLabelB}
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {categoryComparisonRows.map((row) => (
                    <tr key={row.category.id}>
                      <th scope="row" className="px-4 py-2.5 font-normal sm:px-5">
                        <span className="flex items-center gap-2">
                          <CategoryAvatar category={row.category} size="sm" />
                          <span className="truncate text-xs font-medium text-ink">
                            {row.category.name}
                          </span>
                        </span>
                      </th>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-ink">
                        {formatCurrency(row.amountA, settings.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted">
                        {formatCurrency(row.amountB, settings.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right sm:px-5">
                        <ChangeBadge
                          delta={row.amountA - row.amountB}
                          increaseIsGood={false}
                          currency={settings.currency}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </Panel>

      {/* Spending pace */}
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Spending pace"
          description={`How expenses accumulated day by day through ${labelA}.`}
          action={
            <div className="text-right">
              <p className="text-[10px] text-muted">Total spent</p>
              <p className="font-mono text-xs font-medium tabular-nums text-ink">
                {formatCurrency(summaryA.totalExpenses, settings.currency)}
              </p>
            </div>
          }
        />

        <div className="p-4 sm:p-5">
          {summaryA.totalExpenses === 0 ? (
            <EmptyState
              title="No expenses to plot"
              description={`There are no recorded expenses in ${labelA}.`}
            />
          ) : (
            <CumulativeChart
              data={dailyActivityA}
              currency={settings.currency}
              monthLabel={labelA}
            />
          )}
        </div>
      </Panel>
    </div>
  );
};
