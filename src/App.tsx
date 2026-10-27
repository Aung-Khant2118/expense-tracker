/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AppShell, type NavTab } from './components/AppShell.tsx';
import { DashboardPage } from './components/DashboardPage.tsx';
import { TransactionsPage } from './components/TransactionsPage.tsx';
import { CalendarPage } from './components/CalendarPage.tsx';
import { ReportsPage } from './components/ReportsPage.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { Toast, type ToastMessage } from './components/Toast.tsx';
import { LedgerProvider, useLedger } from './data/LedgerProvider.tsx';
import type { NewTransactionInput, Transaction } from './types/finance.ts';
import { calculateMonthlySummary, formatCurrency, toISODate } from './utils/finance.ts';

function LedgerApp() {
  const {
    settings,
    categories,
    transactions,
    updateSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [now] = useState(() => new Date());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [actionError, setActionError] = useState('');

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const notify = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  const summary = useMemo(
    () => calculateMonthlySummary(transactions, categories, selectedYear, selectedMonth),
    [transactions, categories, selectedYear, selectedMonth]
  );

  // Apply the theme to the document and keep the browser chrome in sync.
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#161616' : '#f4f1e8');

    try {
      localStorage.setItem('ledger_theme_v1', settings.theme);
    } catch {
      // The theme still applies for this session if storage is unavailable.
    }
  }, [settings.theme]);

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

  const handleOpenEditModal = (transaction: Transaction) => {
    setTxToEdit(transaction);
    setModalDefaultDate(undefined);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (data: NewTransactionInput, editId?: string) => {
    if (editId) {
      await updateTransaction(editId, data);
      notify('Transaction updated.');
      return;
    }

    await createTransaction(data);
    notify(
      `${data.type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(
        data.amount,
        settings.currency
      )} added.`
    );
  };

  const handlePromptDeleteTransaction = (transaction: Transaction) => {
    setTxToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!txToDelete) return;

    const deleted = txToDelete;
    await deleteTransaction(deleted.id);
    setTxToDelete(null);
    notify(
      `${deleted.type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(
        deleted.amount,
        settings.currency
      )} deleted.`
    );
  };

  const handleToggleTheme = async () => {
    setActionError('');

    try {
      await updateSettings({
        ...settings,
        theme: settings.theme === 'dark' ? 'light' : 'dark',
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Could not update your theme preference.'
      );
    }
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
        onToggleTheme={() => void handleToggleTheme()}
      >
        <div className="md:pl-60">
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-12 lg:px-8"
          >
            {actionError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-none border-2 border-ink bg-expense-soft px-3.5 py-3 text-xs text-ink shadow-brutal-xs"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-expense" aria-hidden="true" />
                <p className="flex-1 leading-relaxed">{actionError}</p>
                <button
                  type="button"
                  onClick={() => setActionError('')}
                  className="rounded-none border-2 border-transparent p-0.5 hover:border-ink hover:bg-expense/10"
                  aria-label="Dismiss error"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                year={selectedYear}
                month={selectedMonth}
                onMonthChange={(year, month) => {
                  setSelectedYear(year);
                  setSelectedMonth(month);
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
                onMonthChange={(year, month) => {
                  setSelectedYear(year);
                  setSelectedMonth(month);
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

            {activeTab === 'settings' && <SettingsPage />}
          </main>

          <footer className="border-t-2 border-ink">
            <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-1 px-4 py-6 text-[11px] font-medium text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>FinFlow, a private personal expense tracker</span>
              <span>
                Stored in this browser · Amounts in {settings.currency}
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
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTxToDelete(null);
        }}
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

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <LedgerProvider>
      <LedgerApp />
    </LedgerProvider>
  );
}
