/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Category,
  LedgerBackup,
  NewCategoryInput,
  NewTransactionInput,
  Transaction,
  UserSettings,
} from '../types/finance.ts';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SEED_TRANSACTIONS } from './defaultData.ts';
import type { LedgerStore } from '../data/ledgerStore.ts';

export const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions_v1',
  CATEGORIES: 'expense_tracker_categories_v1',
  SETTINGS: 'expense_tracker_settings_v1',
} as const;

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn(`Failed to parse ${key}`, error);
    return null;
  }
}

export function readLocalTransactions(): Transaction[] | null {
  const parsed = readJSON<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS);
  return Array.isArray(parsed) ? parsed : null;
}

export function readLocalCategories(): Category[] | null {
  const parsed = readJSON<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES);
  return Array.isArray(parsed) ? parsed : null;
}

export function readLocalSettings(): UserSettings | null {
  const parsed = readJSON<Partial<UserSettings>>(LOCAL_STORAGE_KEYS.SETTINGS);
  return parsed ? { ...DEFAULT_SETTINGS, ...parsed } : null;
}

export function hasLocalLedgerData(): boolean {
  return Boolean(
    (readLocalTransactions()?.length ?? 0) > 0 ||
      (readLocalCategories()?.length ?? 0) > 0 ||
      localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS)
  );
}

function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function saveCategories(categories: Category[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

function saveSettings(settings: UserSettings): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getLocalCategories(): Category[] {
  const stored = readLocalCategories();
  if (stored && stored.length > 0) return stored;

  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function getLocalTransactions(): Transaction[] {
  const stored = readLocalTransactions();
  if (stored) return stored;

  saveTransactions(SEED_TRANSACTIONS);
  return SEED_TRANSACTIONS;
}

export function getLocalSettings(): UserSettings {
  return readLocalSettings() ?? DEFAULT_SETTINGS;
}

function normalizeTransactionInput(input: NewTransactionInput): Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt'
> {
  return {
    ...input,
    userId: 'local-user',
    amount: Math.abs(Number(input.amount)),
  };
}

export function createLocalTransaction(input: NewTransactionInput): Transaction {
  const transactions = getLocalTransactions();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...normalizeTransactionInput(input),
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  transactions.unshift(transaction);
  saveTransactions(transactions);
  return transaction;
}

export function updateLocalTransaction(
  id: string,
  input: Partial<NewTransactionInput>
): Transaction | null {
  const transactions = getLocalTransactions();
  const index = transactions.findIndex((transaction) => transaction.id === id);
  if (index === -1) return null;

  const current = transactions[index];
  const updated: Transaction = {
    ...current,
    ...input,
    amount:
      input.amount !== undefined ? Math.abs(Number(input.amount)) : current.amount,
    updatedAt: new Date().toISOString(),
  };

  transactions[index] = updated;
  saveTransactions(transactions);
  return updated;
}

export function deleteLocalTransaction(id: string): boolean {
  const transactions = getLocalTransactions();
  const filtered = transactions.filter((transaction) => transaction.id !== id);
  if (filtered.length === transactions.length) return false;

  saveTransactions(filtered);
  return true;
}

export function addLocalCategory(input: NewCategoryInput): Category {
  const categories = getLocalCategories();
  const category: Category = {
    ...input,
    userId: 'local-user',
    id: `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isDefault: false,
  };

  categories.push(category);
  saveCategories(categories);
  return category;
}

export function updateLocalCategory(
  id: string,
  input: Partial<NewCategoryInput>
): Category | null {
  const categories = getLocalCategories();
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return null;

  categories[index] = { ...categories[index], ...input };
  saveCategories(categories);
  return categories[index];
}

export function deleteLocalCategory(
  id: string,
  reassignToCategoryId?: string
): { success: boolean; error?: string } {
  const categories = getLocalCategories();
  const categoryToDelete = categories.find((category) => category.id === id);
  if (!categoryToDelete) {
    return { success: false, error: 'Category not found' };
  }

  const transactions = getLocalTransactions();
  const affected = transactions.filter((transaction) => transaction.categoryId === id);

  if (affected.length > 0) {
    if (!reassignToCategoryId) {
      return {
        success: false,
        error: `Cannot delete "${categoryToDelete.name}" because ${affected.length} transaction(s) use it. Please reassign them first.`,
      };
    }

    saveTransactions(
      transactions.map((transaction) =>
        transaction.categoryId === id
          ? {
              ...transaction,
              categoryId: reassignToCategoryId,
              updatedAt: new Date().toISOString(),
            }
          : transaction
      )
    );
  }

  saveCategories(categories.filter((category) => category.id !== id));
  return { success: true };
}

function replaceLocalLedger(backup: LedgerBackup): void {
  saveCategories(backup.categories);
  saveTransactions(backup.transactions);
  saveSettings(backup.settings ?? DEFAULT_SETTINGS);
}

export function resetLocalLedger(): void {
  saveCategories(DEFAULT_CATEGORIES);
  saveTransactions(SEED_TRANSACTIONS);
  saveSettings(DEFAULT_SETTINGS);
}

export function clearLocalLedger(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
}

export const localLedgerStore: LedgerStore = {
  async load() {
    return {
      settings: getLocalSettings(),
      categories: getLocalCategories(),
      transactions: getLocalTransactions(),
    };
  },

  async saveSettings(settings) {
    saveSettings(settings);
    return settings;
  },

  async createTransaction(input) {
    return createLocalTransaction(input);
  },

  async updateTransaction(id, input) {
    const updated = updateLocalTransaction(id, input);
    if (!updated) throw new Error('Transaction not found.');
    return updated;
  },

  async deleteTransaction(id) {
    if (!deleteLocalTransaction(id)) throw new Error('Transaction not found.');
  },

  async addCategory(input) {
    return addLocalCategory(input);
  },

  async updateCategory(id, input) {
    const updated = updateLocalCategory(id, input);
    if (!updated) throw new Error('Category not found.');
    return updated;
  },

  async deleteCategory(id, reassignTo) {
    const result = deleteLocalCategory(id, reassignTo);
    if (!result.success) throw new Error(result.error || 'Could not delete category.');
  },

  async importBackup(backup) {
    replaceLocalLedger(backup);
  },

  async resetToSample() {
    resetLocalLedger();
  },
};
