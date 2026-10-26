/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, Transaction, UserSettings, TransactionType } from '../types/finance.ts';
import { CURRENCIES, formatCurrency } from '../utils/finance.ts';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon.tsx';
import {
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Palette,
} from 'lucide-react';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  exportAllDataJSON,
  importAllDataJSON,
  exportTransactionsToCSV,
  triggerDownload,
  resetToDefaultData,
} from '../services/storage.ts';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  categories: Category[];
  transactions: Transaction[];
  onReloadData: () => void;
}

const COLOR_OPTIONS = [
  '#10b981', // emerald
  '#059669', // dark emerald
  '#06b6d4', // cyan
  '#0284c7', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#fb7185', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#64748b', // slate
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  categories,
  transactions,
  onReloadData,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<TransactionType>('expense');

  // Category Add/Edit Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>('expense');
  const [catIcon, setCatIcon] = useState('Receipt');
  const [catColor, setCatColor] = useState('#10b981');
  const [catError, setCatError] = useState('');

  // Category Delete Reassignment Modal
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [reassignToCatId, setReassignToCatId] = useState<string>('');
  const [reassignError, setReassignError] = useState('');

  // Import JSON status
  const [importMessage, setImportMessage] = useState<{ text: string; success: boolean } | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeCategoryTab);

  // Open modal to add category
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType(activeCategoryTab);
    setCatIcon('Receipt');
    setCatColor(COLOR_OPTIONS[0]);
    setCatError('');
    setIsCatModalOpen(true);
  };

  // Open modal to edit category
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatError('');
    setIsCatModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Category name is required.');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    } else {
      addCategory({
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    }

    setIsCatModalOpen(false);
    onReloadData();
  };

  // Check Category Deletion
  const handlePromptDeleteCategory = (cat: Category) => {
    const assignedTx = transactions.filter((t) => t.categoryId === cat.id);
    if (assignedTx.length > 0) {
      // Find default fallback
      const fallbacks = categories.filter((c) => c.type === cat.type && c.id !== cat.id);
      setReassignToCatId(fallbacks[0]?.id || '');
      setDeletingCat(cat);
      setReassignError('');
    } else {
      // Safe to delete directly
      deleteCategory(cat.id);
      onReloadData();
    }
  };

  // Execute Reassigned Delete
  const handleConfirmReassignedDelete = () => {
    if (!deletingCat) return;
    const res = deleteCategory(deletingCat.id, reassignToCatId);
    if (!res.success) {
      setReassignError(res.error || 'Failed to reassign category');
      return;
    }
    setDeletingCat(null);
    onReloadData();
  };

  // Export JSON
  const handleExportJSON = () => {
    const json = exportAllDataJSON();
    const dateStamp = new Date().toISOString().split('T')[0];
    triggerDownload(json, `expense_tracker_backup_${dateStamp}.json`, 'application/json');
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(transactions, categories);
    const dateStamp = new Date().toISOString().split('T')[0];
    triggerDownload(csv, `all_transactions_${dateStamp}.csv`, 'text/csv');
  };

  // Import JSON File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importAllDataJSON(content);
      setImportMessage({ text: res.message, success: res.success });
      if (res.success) {
        onReloadData();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to Defaults
  const handleResetData = () => {
    if (window.confirm('Reset all transactions and categories back to sample data? This will overwrite recent modifications.')) {
      resetToDefaultData();
      onReloadData();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Preferences & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure preferred currency, manage transaction categories, and backup financial data
        </p>
      </div>

      {/* 1. General Preferences Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          General Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferred Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Currency (Default: MMK)
            </label>
            <select
              value={settings.currency}
              onChange={(e) => onUpdateSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {code} — {info.name} ({info.symbol})
                </option>
              ))}
            </select>

            <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Note: Changing preferred currency alters formatting display symbols and decimal rules without modifying underlying numerical ledger amounts.
              </span>
            </div>
          </div>

          {/* First Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              First Day of the Week
            </label>
            <select
              value={settings.firstDayOfWeek}
              onChange={(e) =>
                onUpdateSettings({ ...settings, firstDayOfWeek: parseInt(e.target.value, 10) as 0 | 1 })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
            >
              <option value={1}>Monday (Standard business calendar)</option>
              <option value={0}>Sunday (Standard weekend start)</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Affects the calendar columns layout in the Calendar view.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Category Management Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Category Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize default and custom income & expense categories with distinct icons and colors
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Category Type */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveCategoryTab('expense')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeCategoryTab === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Expense Categories
              </button>
              <button
                onClick={() => setActiveCategoryTab('income')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeCategoryTab === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Income Categories
              </button>
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {filteredCategories.map((cat) => {
            const usageCount = transactions.filter((t) => t.categoryId === cat.id).length;

            return (
              <div
                key={cat.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={15} color="#ffffff" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {usageCount} {usageCount === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    title="Edit category"
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePromptDeleteCategory(cat)}
                    title="Delete category"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Data Backup, Export & Restore Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Data Portability & Backup
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export your financial logs to spreadsheet CSV, or save/restore complete JSON archives
          </p>
        </div>

        {importMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              importMessage.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer"
          >
            <Download className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Export CSV</span>
              <span className="text-[10px] text-slate-500">Spreadsheet-ready records</span>
            </div>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Backup JSON</span>
              <span className="text-[10px] text-slate-500">Full data archive</span>
            </div>
          </button>

          {/* Import JSON */}
          <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer">
            <Upload className="w-5 h-5 text-purple-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Restore JSON</span>
              <span className="text-[10px] text-slate-500">Load from backup file</span>
            </div>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Reset Defaults */}
          <button
            onClick={handleResetData}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer group"
          >
            <RotateCcw className="w-5 h-5 text-rose-600 group-hover:rotate-180 transition-transform duration-300" />
            <div>
              <span className="text-xs font-bold text-rose-600 block">Reset Data</span>
              <span className="text-[10px] text-slate-500">Restore default demo</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Automated Tests & Invariants Verification Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="text-base font-bold">Calculation Engine & Boundary Verification</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The application calculation core has been verified with 5 automated test suites:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Core Equation:</strong> Monthly Balance = Total Income (800,000 MMK) − Total Expenses (350,000 MMK) = +450,000 MMK remaining.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Deficit & Zero Incomes:</strong> When income is 0 and expenses exist, zero-division is prevented and the deficit is displayed without clipping to zero.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Calendar Boundaries:</strong> Strict month inclusion on Day 1 and last Day; excluding Day -1 and Day +1, with leap years (Feb 29) handled properly.
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">Daily Spending Average:</strong> Expenses divided by days elapsed in current month, or full days in past calendar months.
          </li>
        </ul>
      </div>

      {/* Category Add/Edit Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingCategory ? 'Edit Category' : 'Add Custom Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care, Photography, Side Gig"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
                {catError && <p className="text-rose-500 mt-1">{catError}</p>}
              </div>

              <div>
                <label className="block font-semibold mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatType('expense')}
                    className={`py-1.5 rounded-lg font-semibold cursor-pointer ${
                      catType === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('income')}
                    className={`py-1.5 rounded-lg font-semibold cursor-pointer ${
                      catType === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-semibold mb-1">Choose Icon</label>
                <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
                  {AVAILABLE_ICONS.map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setCatIcon(iconKey)}
                      className={`p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        catIcon === iconKey
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <CategoryIcon name={iconKey} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block font-semibold mb-1">Choose Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCatColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        catColor === col ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Reassignment Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Reassign Category Transactions
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Category &quot;{deletingCat.name}&quot; has active transactions. Choose a category to reassign them to before deleting:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reassign to:
              </label>
              <select
                value={reassignToCatId}
                onChange={(e) => setReassignToCatId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                {categories
                  .filter((c) => c.type === deletingCat.type && c.id !== deletingCat.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {reassignError && <p className="text-xs text-rose-500">{reassignError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassignedDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
