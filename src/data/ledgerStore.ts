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

export interface LedgerData {
  settings: UserSettings;
  categories: Category[];
  transactions: Transaction[];
}

export interface LedgerStore {
  load(): Promise<LedgerData>;
  saveSettings(settings: UserSettings): Promise<UserSettings>;
  createTransaction(input: NewTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: Partial<NewTransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  addCategory(input: NewCategoryInput): Promise<Category>;
  updateCategory(id: string, input: Partial<NewCategoryInput>): Promise<Category>;
  deleteCategory(id: string, reassignTo?: string): Promise<void>;
  importBackup(backup: LedgerBackup): Promise<void>;
  resetToSample(): Promise<void>;
}
