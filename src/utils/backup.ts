/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Category,
  LedgerBackup,
  Transaction,
  UserSettings,
} from '../types/finance.ts';
import { DEFAULT_SETTINGS } from '../services/defaultData.ts';

interface BackupInput {
  settings: UserSettings;
  categories: Category[];
  transactions: Transaction[];
}

export function buildBackupJSON({
  settings,
  categories,
  transactions,
}: BackupInput): string {
  const backup: LedgerBackup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings,
    categories,
    transactions,
  };

  return JSON.stringify(backup, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategory(value: unknown): value is Category {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.icon === 'string' &&
    typeof value.color === 'string'
  );
}

function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    typeof value.categoryId === 'string' &&
    typeof value.transactionDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.transactionDate)
  );
}

export function parseBackupJSON(json: string): LedgerBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('That backup file has an unexpected format.');
  }

  if (!Array.isArray(parsed.categories) || !parsed.categories.every(isCategory)) {
    throw new Error('The backup is missing valid categories.');
  }

  if (!Array.isArray(parsed.transactions) || !parsed.transactions.every(isTransaction)) {
    throw new Error('The backup is missing valid transactions.');
  }

  const settings = isRecord(parsed.settings)
    ? ({ ...DEFAULT_SETTINGS, ...parsed.settings } as UserSettings)
    : undefined;

  return {
    version: typeof parsed.version === 'string' ? parsed.version : '1.0',
    exportDate: typeof parsed.exportDate === 'string' ? parsed.exportDate : new Date().toISOString(),
    settings,
    categories: parsed.categories,
    transactions: parsed.transactions,
  };
}
