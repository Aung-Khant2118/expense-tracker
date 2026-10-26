/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Category, Transaction } from '../types/finance.ts';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[]
): string {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const headers = [
    'ID',
    'Date',
    'Type',
    'Amount',
    'Category',
    'Payment Method',
    'Description',
    'Created At',
  ];

  const rows = transactions.map((transaction) => {
    const categoryName = categoryNames.get(transaction.categoryId) || 'Uncategorized';
    return [
      transaction.id,
      transaction.transactionDate,
      transaction.type,
      transaction.amount.toString(),
      `"${categoryName.replace(/"/g, '""')}"`,
      `"${(transaction.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(transaction.description || '').replace(/"/g, '""')}"`,
      transaction.createdAt,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
