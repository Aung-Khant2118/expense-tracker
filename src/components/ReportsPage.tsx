/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transaction, Category, UserSettings } from '../types/finance.ts';
import {
  calculateCategoryBreakdown,
  calculateDailyActivity,
  calculateMonthlySummary,
  filterTransactionsByMonth,
  formatCurrency,
  getMonthName,
  getShortMonthName,
} from '../utils/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import { BarChart3, TrendingUp, TrendingDown, ArrowRight, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  transactions,
  categories,
  settings,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Comparison State
  const [compareMonthA, setCompareMonthA] = useState<number>(currentMonth);
  const [compareYearA, setCompareYearA] = useState<number>(currentYear);

  const [compareMonthB, setCompareMonthB] = useState<number>(currentMonth === 1 ? 12 : currentMonth - 1);
  const [compareYearB, setCompareYearB] = useState<number>(currentMonth === 1 ? currentYear - 1 : currentYear);

  // Active trend year
  const [trendYear, setTrendYear] = useState<number>(currentYear);

  // 12 Months data for trendYear
  const monthlyTrends = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const summary = calculateMonthlySummary(transactions, categories, trendYear, m);
      return {
        month: m,
        monthName: getShortMonthName(m),
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        balance: summary.monthlyBalance,
      };
    });
  }, [transactions, categories, trendYear]);

  // Max value for 12 months scaling
  const maxTrendVal = useMemo(() => {
    let max = 1;
    for (const d of monthlyTrends) {
      if (d.income > max) max = d.income;
      if (d.expenses > max) max = d.expenses;
    }
    return max;
  }, [monthlyTrends]);

  // Summaries for Month A and Month B comparison
  const summaryA = useMemo(
    () => calculateMonthlySummary(transactions, categories, compareYearA, compareMonthA),
    [transactions, categories, compareYearA, compareMonthA]
  );

  const summaryB = useMemo(
    () => calculateMonthlySummary(transactions, categories, compareYearB, compareMonthB),
    [transactions, categories, compareYearB, compareMonthB]
  );

  // Month A transactions & breakdown
  const txA = useMemo(
    () => filterTransactionsByMonth(transactions, compareYearA, compareMonthA),
    [transactions, compareYearA, compareMonthA]
  );
  const breakdownA = useMemo(() => calculateCategoryBreakdown(txA, categories), [txA, categories]);

  // Month B transactions & breakdown
  const txB = useMemo(
    () => filterTransactionsByMonth(transactions, compareYearB, compareMonthB),
    [transactions, compareYearB, compareMonthB]
  );
  const breakdownB = useMemo(() => calculateCategoryBreakdown(txB, categories), [txB, categories]);

  // Combined category comparison map
  const categoryComparisonRows = useMemo(() => {
    const map = new Map<string, { cat: Category; amountA: number; amountB: number }>();

    for (const c of categories.filter((cat) => cat.type === 'expense')) {
      map.set(c.id, { cat: c, amountA: 0, amountB: 0 });
    }

    for (const item of breakdownA) {
      const existing = map.get(item.categoryId);
      if (existing) existing.amountA = item.amount;
    }

    for (const item of breakdownB) {
      const existing = map.get(item.categoryId);
      if (existing) existing.amountB = item.amount;
    }

    return Array.from(map.values())
      .filter((row) => row.amountA > 0 || row.amountB > 0)
      .sort((a, b) => b.amountA - a.amountA);
  }, [categories, breakdownA, breakdownB]);

  // Cumulative spending trend for Month A
  const dailyActivityA = useMemo(
    () => calculateDailyActivity(transactions, compareYearA, compareMonthA),
    [transactions, compareYearA, compareMonthA]
  );

  const maxCumulativeExpense = Math.max(
    ...dailyActivityA.map((d) => d.cumulativeExpense),
    1
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Financial Reports & Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Annual cash flow patterns, spending trajectories, and month-over-month variances
        </p>
      </div>

      {/* 1. Annual Income vs Expenses Trend Chart */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Income vs. Expenses Trend ({trendYear})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              12-month overview of cash inflows versus outflows
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Expenses</span>
              </div>
            </div>

            <select
              value={trendYear}
              onChange={(e) => setTrendYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 12-Month Bars */}
        <div className="mt-6 grid grid-cols-12 gap-1 sm:gap-2 items-end h-56 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {monthlyTrends.map((d) => {
            const incPct = maxTrendVal > 0 ? (d.income / maxTrendVal) * 100 : 0;
            const expPct = maxTrendVal > 0 ? (d.expenses / maxTrendVal) * 100 : 0;

            return (
              <div key={d.month} className="flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
                  <span>{getMonthName(d.month)} {trendYear}</span>
                  <span className="text-emerald-400">+{formatCurrency(d.income, settings.currency)}</span>
                  <span className="text-rose-400">-{formatCurrency(d.expenses, settings.currency)}</span>
                </div>

                <div className="flex items-end gap-1 w-full max-w-[28px] h-full justify-center">
                  {/* Income bar */}
                  <div
                    style={{ height: `${incPct}%` }}
                    className="w-1/2 bg-emerald-500 dark:bg-emerald-600 rounded-t-xs transition-all duration-300 min-h-[2px]"
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${expPct}%` }}
                    className="w-1/2 bg-rose-500 dark:bg-rose-600 rounded-t-xs transition-all duration-300 min-h-[2px]"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {d.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Month-to-Month Comparative Tool */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Month-to-Month Comparative Analyzer</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare two calendar months side-by-side to understand spending variance and category changes
          </p>
        </div>

        {/* Month Pickers */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Month A */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Primary Month (Month A)
            </span>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={compareMonthA}
                onChange={(e) => setCompareMonthA(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>
              <select
                value={compareYearA}
                onChange={(e) => setCompareYearA(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Benchmark Month B */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Benchmark Month (Month B)
            </span>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={compareMonthB}
                onChange={(e) => setCompareMonthB(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>
              <select
                value={compareYearB}
                onChange={(e) => setCompareYearB(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Side-by-Side Summary Comparison Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Income Comparison */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Income</span>
            <div className="mt-2 flex justify-between items-baseline font-mono tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                {formatCurrency(summaryA.totalIncome, settings.currency)}
              </span>
              <span className="text-slate-500 text-xs">
                vs {formatCurrency(summaryB.totalIncome, settings.currency)}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium flex items-center gap-1">
              {summaryA.totalIncome >= summaryB.totalIncome ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className={summaryA.totalIncome >= summaryB.totalIncome ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(summaryA.totalIncome - summaryB.totalIncome, settings.currency)}
              </span>
            </div>
          </div>

          {/* Expenses Comparison */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Expenses</span>
            <div className="mt-2 flex justify-between items-baseline font-mono tabular-nums">
              <span className="text-rose-600 dark:text-rose-400 font-bold text-base">
                {formatCurrency(summaryA.totalExpenses, settings.currency)}
              </span>
              <span className="text-slate-500 text-xs">
                vs {formatCurrency(summaryB.totalExpenses, settings.currency)}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium flex items-center gap-1">
              {summaryA.totalExpenses <= summaryB.totalExpenses ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className={summaryA.totalExpenses <= summaryB.totalExpenses ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(summaryA.totalExpenses - summaryB.totalExpenses, settings.currency)}
              </span>
            </div>
          </div>

          {/* Balance Comparison */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Net Money Left</span>
            <div className="mt-2 flex justify-between items-baseline font-mono tabular-nums">
              <span className={`font-bold text-base ${summaryA.monthlyBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(summaryA.monthlyBalance, settings.currency)}
              </span>
              <span className="text-slate-500 text-xs">
                vs {formatCurrency(summaryB.monthlyBalance, settings.currency)}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium flex items-center gap-1">
              {summaryA.monthlyBalance >= summaryB.monthlyBalance ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className={summaryA.monthlyBalance >= summaryB.monthlyBalance ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(summaryA.monthlyBalance - summaryB.monthlyBalance, settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Category-by-Category Expense Comparison Table */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Expense Breakdown by Category ({getMonthName(compareMonthA).slice(0, 3)} vs {getMonthName(compareMonthB).slice(0, 3)})
          </h4>

          {categoryComparisonRows.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No expense records found for either month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">{getMonthName(compareMonthA).slice(0, 3)} {compareYearA}</th>
                    <th className="py-2.5 px-3 text-right">{getMonthName(compareMonthB).slice(0, 3)} {compareYearB}</th>
                    <th className="py-2.5 px-3 text-right">Variance (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryComparisonRows.map((row) => {
                    const diff = row.amountA - row.amountB;
                    return (
                      <tr key={row.cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: row.cat.color }}
                          >
                            <CategoryIcon name={row.cat.icon} size={11} color="#ffffff" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {row.cat.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums">
                          {formatCurrency(row.amountA, settings.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                          {formatCurrency(row.amountB, settings.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                          <span className={diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-400'}>
                            {diff > 0 ? '+' : ''}{formatCurrency(diff, settings.currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Cumulative Daily Spending Curve for Month A */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Cumulative Spending Trajectory ({getMonthName(compareMonthA)} {compareYearA})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Day-by-day accumulation of expenses across the calendar month
          </p>
        </div>

        <div className="mt-6 flex items-end gap-1 h-36 pt-4 pb-1 overflow-x-auto">
          {dailyActivityA.map((day) => {
            const pct = maxCumulativeExpense > 0 ? (day.cumulativeExpense / maxCumulativeExpense) * 100 : 0;
            return (
              <div
                key={day.date}
                title={`Day ${day.dayNumber}: ${formatCurrency(day.cumulativeExpense, settings.currency)}`}
                className="flex-1 min-w-[10px] flex flex-col items-center justify-end h-full group"
              >
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full bg-slate-300 dark:bg-slate-700 hover:bg-emerald-500 transition-colors rounded-t-xs min-h-[1px]"
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
          <span>Day 1</span>
          <span>Day 15</span>
          <span>Day {dailyActivityA.length} ({formatCurrency(summaryA.totalExpenses, settings.currency)})</span>
        </div>
      </div>
    </div>
  );
};
