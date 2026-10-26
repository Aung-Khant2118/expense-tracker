/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Transaction, UserSettings } from '../types/finance.ts';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SEED_TRANSACTIONS } from './defaultData.ts';

const STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions_v1',
  CATEGORIES: 'expense_tracker_categories_v1',
  SETTINGS: 'expense_tracker_settings_v1',
};

type StorageListener = () => void;
const listeners = new Set<StorageListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error invoking storage listener', e);
    }
  });
}

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored categories, falling back to defaults', e);
  }
  // Initialize with defaults
  saveCategories(DEFAULT_CATEGORIES, false);
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: Category[], notify = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    if (notify) notifyListeners();
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function addCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
  const categories = getStoredCategories();
  const newCat: Category = {
    ...category,
    id: `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isDefault: false,
  };
  categories.push(newCat);
  saveCategories(categories);
  return newCat;
}

export function updateCategory(id: string, updates: Partial<Category>): Category | null {
  const categories = getStoredCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  categories[index] = { ...categories[index], ...updates };
  saveCategories(categories);
  return categories[index];
}

/**
 * Delete category with reassignment protection.
 * If transactions exist for this category, reassign them or block if no reassign ID.
 */
export function deleteCategory(id: string, reassignToCategoryId?: string): { success: boolean; error?: string } {
  const categories = getStoredCategories();
  const categoryToDelete = categories.find((c) => c.id === id);
  if (!categoryToDelete) {
    return { success: false, error: 'Category not found' };
  }

  const transactions = getStoredTransactions();
  const affectedTransactions = transactions.filter((t) => t.categoryId === id);

  if (affectedTransactions.length > 0) {
    if (!reassignToCategoryId) {
      return {
        success: false,
        error: `Cannot delete "${categoryToDelete.name}" because ${affectedTransactions.length} transaction(s) are assigned to it. Please reassign them first.`,
      };
    }

    // Reassign transactions to new category
    const updatedTransactions = transactions.map((t) => {
      if (t.categoryId === id) {
        return { ...t, categoryId: reassignToCategoryId, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    saveTransactions(updatedTransactions, false);
  }

  const updatedCategories = categories.filter((c) => c.id !== id);
  saveCategories(updatedCategories);
  return { success: true };
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored transactions, falling back to seed', e);
  }
  // Initialize with seed
  saveTransactions(SEED_TRANSACTIONS, false);
  return SEED_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[], notify = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    if (notify) notifyListeners();
  } catch (e) {
    console.error('Failed to save transactions', e);
  }
}

export function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
  const transactions = getStoredTransactions();
  const now = new Date().toISOString();
  const newTx: Transaction = {
    ...data,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    amount: Math.abs(Number(data.amount)),
    createdAt: now,
    updatedAt: now,
  };

  transactions.unshift(newTx);
  saveTransactions(transactions);
  return newTx;
}

export function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Transaction | null {
  const transactions = getStoredTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updated: Transaction = {
    ...transactions[index],
    ...updates,
    amount: updates.amount !== undefined ? Math.abs(Number(updates.amount)) : transactions[index].amount,
    updatedAt: new Date().toISOString(),
  };

  transactions[index] = updated;
  saveTransactions(transactions);
  return updated;
}

export function deleteTransaction(id: string): boolean {
  const transactions = getStoredTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  if (filtered.length === transactions.length) return false;

  saveTransactions(filtered);
  return true;
}

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse stored settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyListeners();
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function resetToDefaultData(): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  notifyListeners();
}

export function exportTransactionsToCSV(transactions: Transaction[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Payment Method', 'Description', 'Created At'];

  const rows = transactions.map((t) => {
    const catName = catMap.get(t.categoryId) || 'Uncategorized';
    return [
      t.id,
      t.transactionDate,
      t.type,
      t.amount.toString(),
      `"${catName.replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.createdAt,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllDataJSON(): string {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: getStoredSettings(),
    categories: getStoredCategories(),
    transactions: getStoredTransactions(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importAllDataJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.transactions || !Array.isArray(data.transactions)) {
      return { success: false, message: 'Invalid backup file: transactions missing or corrupt' };
    }
    if (!data.categories || !Array.isArray(data.categories)) {
      return { success: false, message: 'Invalid backup file: categories missing or corrupt' };
    }

    if (data.categories) saveCategories(data.categories, false);
    if (data.transactions) saveTransactions(data.transactions, false);
    if (data.settings) saveSettings(data.settings);
    else notifyListeners();

    return { success: true, message: `Successfully imported ${data.transactions.length} transactions and ${data.categories.length} categories!` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to parse JSON backup file' };
  }
}
