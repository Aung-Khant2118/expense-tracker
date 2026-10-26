/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavTab, TopBar } from './components/TopBar.tsx';
import { DashboardPage } from './components/DashboardPage.tsx';
import { TransactionsPage } from './components/TransactionsPage.tsx';
import { CalendarPage } from './components/CalendarPage.tsx';
import { ReportsPage } from './components/ReportsPage.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { Transaction, Category, UserSettings } from './types/finance.ts';
import {
  getStoredTransactions,
  getStoredCategories,
  getStoredSettings,
  saveSettings,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  subscribeToStorage,
} from './services/storage.ts';
import { calculateMonthlySummary, formatCurrency } from './utils/finance.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Today's reference (October 2026 based on runtime context)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Storage State
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());

  // Reload data from storage
  const reloadData = useCallback(() => {
    setTransactions(getStoredTransactions());
    setCategories(getStoredCategories());
    setSettings(getStoredSettings());
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      reloadData();
    });
    return unsubscribe;
  }, [reloadData]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Monthly summary computed reactively
  const summary = useMemo(() => {
    return calculateMonthlySummary(transactions, categories, selectedYear, selectedMonth);
  }, [transactions, categories, selectedYear, selectedMonth]);

  // Handlers for transactions
  const handleOpenAddModal = (dateStr?: string) => {
    setTxToEdit(null);
    setModalDefaultDate(
      dateStr ||
        `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${
          selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
            ? String(now.getDate()).padStart(2, '0')
            : '01'
        }`
    );
    setIsTxModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setTxToEdit(tx);
    setModalDefaultDate(undefined);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      updateTransaction(editId, data);
    } else {
      createTransaction(data);
    }
    reloadData();
  };

  const handlePromptDeleteTransaction = (tx: Transaction) => {
    setTxToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTransaction = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete.id);
      setTxToDelete(null);
      reloadData();
    }
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Bar with Brand, 5 Single-line Links, and Primary Action */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            year={selectedYear}
            month={selectedMonth}
            onMonthChange={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            transactions={transactions}
            categories={categories}
            settings={settings}
            summary={summary}
            onOpenAddModal={() => handleOpenAddModal()}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handlePromptDeleteTransaction}
            onViewAllTransactions={() => setActiveTab('transactions')}
            onNavigateToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            categories={categories}
            settings={settings}
            onOpenAddModal={() => handleOpenAddModal()}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handlePromptDeleteTransaction}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarPage
            year={selectedYear}
            month={selectedMonth}
            onMonthChange={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            transactions={transactions}
            categories={categories}
            settings={settings}
            onOpenAddModalWithDate={(dateStr) => handleOpenAddModal(dateStr)}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handlePromptDeleteTransaction}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage
            transactions={transactions}
            categories={categories}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            categories={categories}
            transactions={transactions}
            onReloadData={reloadData}
          />
        )}
      </main>

      {/* Transaction Add/Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        categories={categories}
        currency={settings.currency}
        defaultDate={modalDefaultDate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTransaction}
        title="Delete Transaction"
        message={
          txToDelete
            ? `Are you sure you want to permanently delete this ${txToDelete.type} entry of ${formatCurrency(
                txToDelete.amount,
                settings.currency
              )} on ${txToDelete.transactionDate}? This action cannot be undone.`
            : 'Are you sure you want to delete this transaction?'
        }
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Expense Tracker · Accurate Cash Flow & Spending Insights</span>
          <span className="font-mono text-[11px] tabular-nums">
            Default Currency: MMK ({settings.currency})
          </span>
        </div>
      </footer>
    </div>
  );
}
