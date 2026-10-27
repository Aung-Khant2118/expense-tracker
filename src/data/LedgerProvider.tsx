/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type {
  Category,
  LedgerBackup,
  NewCategoryInput,
  NewTransactionInput,
  Transaction,
  UserSettings,
} from '../types/finance.ts';
import type { LedgerData } from './ledgerStore.ts';
import { localLedgerStore } from '../services/localLedger.ts';
import { Button } from '../components/ui.tsx';
import { FullPageLoader } from '../components/FullPageLoader.tsx';

interface LedgerContextValue extends LedgerData {
  refresh: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  createTransaction: (input: NewTransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: Partial<NewTransactionInput>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (input: NewCategoryInput) => Promise<void>;
  updateCategory: (id: string, input: Partial<NewCategoryInput>) => Promise<void>;
  deleteCategory: (id: string, reassignTo?: string) => Promise<void>;
  importBackup: (backup: LedgerBackup) => Promise<void>;
  resetToSample: () => Promise<void>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      b.transactionDate.localeCompare(a.transactionDate) ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    const next = await localLedgerStore.load();
    setData(next);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const next = await localLedgerStore.load();
      setData(next);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load FinFlow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep tabs in sync when the same ledger is open more than once.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('expense_tracker_')) return;
      refresh().catch((error) => {
        console.error('Could not refresh FinFlow after another tab changed it.', error);
      });
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  const updateSettings = useCallback(
    async (settings: UserSettings) => {
      const previous = data?.settings;
      setData((current) => (current ? { ...current, settings } : current));

      try {
        const saved = await localLedgerStore.saveSettings(settings);
        setData((current) => (current ? { ...current, settings: saved } : current));
      } catch (error) {
        if (previous) {
          setData((current) => (current ? { ...current, settings: previous } : current));
        }
        throw error;
      }
    },
    [data?.settings]
  );

  const createTransaction = useCallback(async (input: NewTransactionInput) => {
    const transaction = await localLedgerStore.createTransaction(input);
    setData((current) =>
      current
        ? { ...current, transactions: sortTransactions([transaction, ...current.transactions]) }
        : current
    );
  }, []);

  const updateTransaction = useCallback(
    async (id: string, input: Partial<NewTransactionInput>) => {
      const transaction = await localLedgerStore.updateTransaction(id, input);
      setData((current) =>
        current
          ? {
              ...current,
              transactions: sortTransactions(
                current.transactions.map((entry) => (entry.id === id ? transaction : entry))
              ),
            }
          : current
      );
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await localLedgerStore.deleteTransaction(id);
    setData((current) =>
      current
        ? { ...current, transactions: current.transactions.filter((entry) => entry.id !== id) }
        : current
    );
  }, []);

  const addCategory = useCallback(async (input: NewCategoryInput) => {
    const category = await localLedgerStore.addCategory(input);
    setData((current) =>
      current ? { ...current, categories: [...current.categories, category] } : current
    );
  }, []);

  const updateCategory = useCallback(
    async (id: string, input: Partial<NewCategoryInput>) => {
      const category = await localLedgerStore.updateCategory(id, input);
      setData((current) =>
        current
          ? {
              ...current,
              categories: current.categories.map((entry) => (entry.id === id ? category : entry)),
            }
          : current
      );
    },
    []
  );

  const deleteCategory = useCallback(
    async (id: string, reassignTo?: string) => {
      await localLedgerStore.deleteCategory(id, reassignTo);
      await refresh();
    },
    [refresh]
  );

  const importBackup = useCallback(
    async (backup: LedgerBackup) => {
      await localLedgerStore.importBackup(backup);
      await refresh();
    },
    [refresh]
  );

  const resetToSample = useCallback(async () => {
    await localLedgerStore.resetToSample();
    await refresh();
  }, [refresh]);

  const value = useMemo<LedgerContextValue | null>(() => {
    if (!data) return null;
    return {
      ...data,
      refresh,
      updateSettings,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      importBackup,
      resetToSample,
    };
  }, [
    data,
    refresh,
    updateSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    importBackup,
    resetToSample,
  ]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (loadError || !value) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-none border-2 border-ink bg-surface p-6 text-center shadow-brutal">
          <span className="mx-auto grid size-10 place-items-center rounded-none border-2 border-ink bg-expense-soft text-expense">
            <AlertTriangle className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-xl font-black text-ink">
            Could not open FinFlow
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{loadError}</p>
          <Button variant="primary" className="mt-5 w-full justify-center" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            <span>Try again</span>
          </Button>
        </div>
      </div>
    );
  }

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
};

export function useLedger(): LedgerContextValue {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used inside a LedgerProvider');
  }
  return context;
}
