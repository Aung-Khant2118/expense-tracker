/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell, NavTab } from './components/AppShell.tsx';
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
import { calculateMonthlySummary, formatCurrency, toISODate } from './utils/finance.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [now] = useState(() => new Date());

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Storage state
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());

  const reloadData = useCallback(() => {
    setTransactions(getStoredTransactions());
    setCategories(getStoredCategories());
    setSettings(getStoredSettings());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      reloadData();
    });
    return unsubscribe;
  }, [reloadData]);

  // Apply the theme to the document and keep the browser chrome in sync.
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#0f1511' : '#f2f4ef');
  }, [settings.theme]);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const summary = useMemo(() => {
    return calculateMonthlySummary(transactions, categories, selectedYear, selectedMonth);
  }, [transactions, categories, selectedYear, selectedMonth]);

  const handleOpenAddModal = (dateStr?: string) => {
    setTxToEdit(null);
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

    setModalDefaultDate(
      dateStr ||
        (isCurrentMonth
          ? toISODate(now)
          : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
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

  const handleToggleTheme = () => {
    handleUpdateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      >
        <div className="md:pl-60">
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-8"
          >
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

          <footer className="border-t border-rule">
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-1 px-4 py-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>Ledger, a private personal expense tracker</span>
              <span>
                Amounts in {settings.currency}
                {settings.theme === 'dark' ? ' · Dark theme' : ' · Light theme'}
              </span>
            </div>
          </footer>
        </div>
      </AppShell>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        categories={categories}
        currency={settings.currency}
        defaultDate={modalDefaultDate}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTransaction}
        title="Delete this transaction?"
        message={
          txToDelete
            ? `This will permanently remove the ${txToDelete.type} entry of ${formatCurrency(
                txToDelete.amount,
                settings.currency
              )} from ${txToDelete.transactionDate}. This cannot be undone.`
            : 'This transaction will be permanently removed. This cannot be undone.'
        }
      />
    </div>
  );
}
