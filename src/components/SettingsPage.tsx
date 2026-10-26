/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  Edit2,
  FileText,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { Category, TransactionType, UserSettings } from '../types/finance.ts';
import { CURRENCIES, formatCurrency, toISODate } from '../utils/finance.ts';
import { AVAILABLE_ICONS, CategoryAvatar, CategoryIcon } from './CategoryIcon.tsx';
import {
  Button,
  EmptyState,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Panel,
  PanelHeader,
  SegmentedControl,
  cn,
  inputClass,
  selectClass,
} from './ui.tsx';
import { useLedger } from '../data/LedgerProvider.tsx';
import { buildBackupJSON, parseBackupJSON } from '../utils/backup.ts';
import { exportTransactionsToCSV, triggerDownload } from '../utils/csv.ts';

interface ColorOption {
  value: string;
  name: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { value: '#2f6b4f', name: 'Moss' },
  { value: '#3f7d6a', name: 'Pine' },
  { value: '#4a7a8c', name: 'Teal' },
  { value: '#3f6f8a', name: 'Petrol' },
  { value: '#4b5d8a', name: 'Indigo' },
  { value: '#6b5b8f', name: 'Plum' },
  { value: '#8a5470', name: 'Mauve' },
  { value: '#a4482f', name: 'Rust' },
  { value: '#b35c3c', name: 'Brick' },
  { value: '#c08a32', name: 'Ochre' },
  { value: '#8a7a2f', name: 'Olive' },
  { value: '#6f7a3f', name: 'Fern' },
  { value: '#7f8c81', name: 'Sage' },
  { value: '#5d6b60', name: 'Stone' },
  { value: '#8a6b52', name: 'Clay' },
  { value: '#8f5a52', name: 'Rosewood' },
];

const DEFAULT_CATEGORY_COLOR = COLOR_OPTIONS[0].value;

interface DataRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  danger?: boolean;
}

function DataRow({ icon, title, description, action, danger }: DataRowProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            danger ? 'bg-expense-soft text-expense' : 'bg-surface-2 text-muted'
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink sm:text-sm">{title}</p>
          <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{action}</div>
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-xs font-medium text-ink">{value}</dd>
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const {
    settings,
    categories,
    transactions,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    importBackup,
    resetToSample,
  } = useLedger();

  const currencyId = useId();
  const weekStartId = useId();
  const categoryFormId = useId();
  const categoryNameId = useId();
  const reassignId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategoryTab, setActiveCategoryTab] = useState<TransactionType>('expense');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');
  const [categoryIcon, setCategoryIcon] = useState('Receipt');
  const [categoryColor, setCategoryColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [categoryError, setCategoryError] = useState('');

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [reassignError, setReassignError] = useState('');

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; success: boolean } | null>(
    null
  );
  const [preferenceError, setPreferenceError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const filteredCategories = categories.filter(
    (category) => category.type === activeCategoryTab
  );

  const assignedCount = deletingCategory
    ? transactions.filter((tx) => tx.categoryId === deletingCategory.id).length
    : 0;

  const fallbackCategories = deletingCategory
    ? categories.filter(
        (category) =>
          category.type === deletingCategory.type && category.id !== deletingCategory.id
      )
    : [];

  const colorOptions = COLOR_OPTIONS.some((option) => option.value === categoryColor)
    ? COLOR_OPTIONS
    : [{ value: categoryColor, name: 'Current color' }, ...COLOR_OPTIONS];

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType(activeCategoryTab);
    setCategoryIcon('Receipt');
    setCategoryColor(DEFAULT_CATEGORY_COLOR);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryIcon(category.icon);
    setCategoryColor(category.color);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handlePreferenceChange = async (nextSettings: UserSettings) => {
    setPreferenceError('');

    try {
      await updateSettings(nextSettings);
    } catch (error) {
      setPreferenceError(
        error instanceof Error ? error.message : 'Could not save this preference.'
      );
    }
  };

  const handleSaveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = categoryName.trim();

    if (!name) {
      setCategoryError('Give the category a name.');
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.id !== editingCategory?.id &&
        category.type === categoryType &&
        category.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      setCategoryError('A category with this name already exists for this type.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError('');

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name,
          type: categoryType,
          icon: categoryIcon,
          color: categoryColor,
        });
      } else {
        await addCategory({
          name,
          type: categoryType,
          icon: categoryIcon,
          color: categoryColor,
        });
      }

      setIsCategoryModalOpen(false);
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : 'Could not save this category.'
      );
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handlePromptDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setReassignError('');

    const fallbacks = categories.filter(
      (entry) => entry.type === category.type && entry.id !== category.id
    );
    setReassignTo(fallbacks[0]?.id || '');
  };

  const handleConfirmCategoryDelete = async () => {
    if (!deletingCategory) return;

    const affected = transactions.filter(
      (transaction) => transaction.categoryId === deletingCategory.id
    ).length;

    setIsDeletingCategory(true);
    setReassignError('');

    try {
      await deleteCategory(
        deletingCategory.id,
        affected > 0 ? reassignTo : undefined
      );
      setDeletingCategory(null);
    } catch (error) {
      setReassignError(
        error instanceof Error ? error.message : 'Could not reassign these transactions.'
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleExportJSON = () => {
    triggerDownload(
      buildBackupJSON({ settings, categories, transactions }),
      `ledger-backup-${toISODate()}.json`,
      'application/json'
    );
  };

  const handleExportCSV = () => {
    triggerDownload(
      exportTransactionsToCSV(transactions, categories),
      `ledger-transactions-${toISODate()}.csv`,
      'text/csv'
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const backup = parseBackupJSON(await file.text());
      await importBackup(backup);
      setImportMessage({
        text: `Imported ${backup.transactions.length} transactions and ${backup.categories.length} categories.`,
        success: true,
      });
    } catch (error) {
      setImportMessage({
        text: error instanceof Error ? error.message : 'Could not import this backup.',
        success: false,
      });
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    setImportMessage(null);

    try {
      await resetToSample();
      setImportMessage({
        text: 'The sample ledger has been restored.',
        success: true,
      });
      setIsResetOpen(false);
    } catch (error) {
      setImportMessage({
        text: error instanceof Error ? error.message : 'Could not reset the ledger.',
        success: false,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Choose how Ledger looks, organize your categories, and keep a backup."
      />

      {/* Appearance and preferences */}
      <Panel>
        <PanelHeader
          title="Appearance"
          description="Theme, currency, and calendar preferences."
        />

        {preferenceError && (
          <div
            role="alert"
            className="border-b border-rule bg-expense-soft/60 px-4 py-3 text-[11px] font-medium text-expense sm:px-5"
          >
            {preferenceError}
          </div>
        )}

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-lg border border-rule bg-surface-2/40 p-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
            <div>
              <p className="text-xs font-semibold text-ink">Theme</p>
              <p className="mt-0.5 text-[11px] text-muted">
                Follow your environment with a light paper or dark forest canvas.
              </p>
            </div>

            <SegmentedControl
              value={settings.theme}
              onChange={(theme) => void handlePreferenceChange({ ...settings, theme })}
              options={[
                {
                  value: 'light',
                  label: 'Light',
                  icon: <Sun className="size-3.5" />,
                },
                {
                  value: 'dark',
                  label: 'Dark',
                  icon: <Moon className="size-3.5" />,
                },
              ]}
              ariaLabel="Color theme"
            />
          </div>

          <Field
            label="Currency"
            htmlFor={currencyId}
            hint={`Example: ${formatCurrency(
              1250000,
              settings.currency
            )}. Stored amounts do not change.`}
          >
            <select
              id={currencyId}
              value={settings.currency}
              onChange={(event) =>
                void handlePreferenceChange({ ...settings, currency: event.target.value })
              }
              className={selectClass}
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {code} — {info.name} ({info.symbol})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Week starts on"
            htmlFor={weekStartId}
            hint="Changes the column order in the calendar."
          >
            <select
              id={weekStartId}
              value={settings.firstDayOfWeek}
              onChange={(event) =>
                void handlePreferenceChange({
                  ...settings,
                  firstDayOfWeek: parseInt(event.target.value, 10) as 0 | 1,
                })
              }
              className={selectClass}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </Field>
        </div>
      </Panel>

      {/* Categories */}
      <Panel>
        <PanelHeader
          title="Categories"
          description="Rename, recolor, or add categories for income and expenses."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={activeCategoryTab}
                onChange={setActiveCategoryTab}
                options={[
                  { value: 'expense', label: 'Expenses' },
                  { value: 'income', label: 'Income' },
                ]}
                ariaLabel="Category type"
                size="sm"
              />
              <Button variant="primary" size="sm" onClick={openAddCategory}>
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Add</span>
              </Button>
            </div>
          }
        />

        <div className="p-4 sm:p-5">
          {filteredCategories.length === 0 ? (
            <EmptyState
              title="No categories yet"
              description={`Add an ${activeCategoryTab} category to start organizing entries.`}
              action={
                <Button variant="secondary" onClick={openAddCategory}>
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>Add category</span>
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredCategories.map((category) => {
                const usageCount = transactions.filter(
                  (tx) => tx.categoryId === category.id
                ).length;

                return (
                  <li
                    key={category.id}
                    className="flex items-center gap-3 rounded-lg border border-rule bg-surface px-3 py-2.5"
                  >
                    <CategoryAvatar category={category} size="md" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{category.name}</p>
                      <p className="text-[11px] text-muted">
                        {usageCount} {usageCount === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={`Edit ${category.name}`}
                        onClick={() => openEditCategory(category)}
                        className="size-8 text-faint hover:text-ink"
                      >
                        <Edit2 className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${category.name}`}
                        onClick={() => handlePromptDeleteCategory(category)}
                        className="size-8 text-faint hover:bg-expense-soft hover:text-expense"
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      {/* Data */}
      <Panel>
        <PanelHeader
          title="Data and backups"
          description="Your ledger lives in this browser. Keep a copy somewhere safe."
        />

        {importMessage && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'border-b border-rule px-4 py-3 text-[11px] font-medium sm:px-5',
              importMessage.success
                ? 'bg-income-soft/60 text-income'
                : 'bg-expense-soft/60 text-expense'
            )}
          >
            {importMessage.text}
          </div>
        )}

        <div className="divide-y divide-rule">
          <DataRow
            icon={<FileText className="size-4" />}
            title="Export transactions as CSV"
            description="A spreadsheet-ready copy of every transaction, including categories and notes."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                disabled={transactions.length === 0}
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </Button>
            }
          />

          <DataRow
            icon={<Database className="size-4" />}
            title="Save a full backup"
            description="Download a JSON archive with all transactions, categories, and preferences."
            action={
              <Button variant="secondary" size="sm" onClick={handleExportJSON}>
                <Download className="size-3.5" />
                <span>Save backup</span>
              </Button>
            }
          />

          <DataRow
            icon={<Upload className="size-4" />}
            title="Restore from a backup"
            description="Load a JSON archive. This replaces the data currently in this browser."
            action={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => void handleFileUpload(event)}
                  className="sr-only"
                  aria-label="Choose a JSON backup to restore"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className="size-3.5" />
                  <span>{isImporting ? 'Restoring…' : 'Choose file'}</span>
                </Button>
              </>
            }
          />

          <DataRow
            icon={<RotateCcw className="size-4" />}
            title="Reset to the sample ledger"
            description="Clear everything and restore the original sample transactions and categories."
            danger
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsResetOpen(true)}
                className="text-expense hover:bg-expense-soft"
                disabled={isResetting}
              >
                <RotateCcw className="size-3.5" />
                <span>Reset data</span>
              </Button>
            }
          />
        </div>
      </Panel>

      {/* About */}
      <Panel>
        <PanelHeader
          title="About Ledger"
          description="A private, local-first expense tracker."
        />

        <dl className="divide-y divide-rule">
          <AboutRow label="Storage" value="This browser only" />
          <AboutRow
            label="Transactions"
            value={transactions.length.toLocaleString('en-US')}
          />
          <AboutRow label="Categories" value={categories.length.toLocaleString('en-US')} />
          <AboutRow label="Currency display" value={formatCurrency(1250000, settings.currency)} />
        </dl>

        <div className="flex items-start gap-2.5 border-t border-rule p-4 text-[11px] leading-relaxed text-muted sm:p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-income" aria-hidden="true" />
          <p>
            Nothing is sent to a server. Export a JSON backup before clearing browser data or
            moving to another device.
          </p>
        </div>
      </Panel>

      {/* Add / edit category */}
      <Modal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit category' : 'New category'}
        description={
          editingCategory
            ? 'Update how this category appears in your ledger.'
            : 'Give the category a name, icon, and color.'
        }
        footer={
          <>
            <Button onClick={() => setIsCategoryModalOpen(false)} disabled={isSavingCategory}>
              Cancel
            </Button>
            <Button type="submit" form={categoryFormId} variant="primary" disabled={isSavingCategory}>
              {isSavingCategory
                ? 'Saving…'
                : editingCategory
                  ? 'Save changes'
                  : 'Create category'}
            </Button>
          </>
        }
      >
        <form id={categoryFormId} onSubmit={handleSaveCategory} className="space-y-4">
          <Field
            label="Name"
            htmlFor={categoryNameId}
            required
            error={categoryError}
          >
            <input
              id={categoryNameId}
              type="text"
              value={categoryName}
              onChange={(event) => {
                setCategoryName(event.target.value);
                if (categoryError) setCategoryError('');
              }}
              placeholder="e.g. Pet care, Photography, Side work"
              className={inputClass}
              data-autofocus
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink">Type</span>
            <div
              className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-0.5"
              role="group"
              aria-label="Category type"
            >
              {(['expense', 'income'] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={categoryType === type}
                  onClick={() => setCategoryType(type)}
                  className={cn(
                    'h-8 rounded-md text-xs font-semibold transition-colors',
                    categoryType === type
                      ? 'bg-surface text-ink'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  {type === 'expense' ? 'Expense' : 'Income'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink">Icon</span>
            <div className="grid max-h-36 grid-cols-7 gap-1 overflow-y-auto rounded-lg border border-rule bg-surface p-1.5 sm:grid-cols-9">
              {AVAILABLE_ICONS.map((iconKey) => {
                const selected = categoryIcon === iconKey;

                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setCategoryIcon(iconKey)}
                    aria-label={`Use ${iconKey} icon`}
                    aria-pressed={selected}
                    className={cn(
                      'grid size-8 place-items-center rounded-md transition-colors',
                      selected
                        ? 'bg-ink text-canvas'
                        : 'text-muted hover:bg-surface-2 hover:text-ink'
                    )}
                  >
                    <CategoryIcon name={iconKey} size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink">Color</span>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((option) => {
                const selected = categoryColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryColor(option.value)}
                    aria-label={`Use ${option.name}`}
                    aria-pressed={selected}
                    style={{ backgroundColor: option.value }}
                    className={cn(
                      'grid size-7 place-items-center rounded-full transition-transform',
                      selected
                        ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface'
                        : 'hover:scale-110'
                    )}
                  >
                    {selected && <Check className="size-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-rule bg-surface-2/40 px-3 py-2.5">
            <CategoryAvatar category={{ icon: categoryIcon, color: categoryColor }} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted">Preview</p>
              <p className="truncate text-sm font-medium text-ink">
                {categoryName.trim() || 'Category name'}
              </p>
            </div>
            <span className="ml-auto shrink-0 text-[10px] capitalize text-faint">
              {categoryType}
            </span>
          </div>
        </form>
      </Modal>

      {/* Delete / reassign category */}
      <Modal
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title={
          assignedCount > 0
            ? 'Reassign transactions'
            : `Delete ${deletingCategory ? `“${deletingCategory.name}”` : 'category'}?`
        }
        description={
          assignedCount > 0
            ? `This category is used by ${assignedCount} ${
                assignedCount === 1 ? 'transaction' : 'transactions'
              }. Choose where they should go before deleting it.`
            : 'This category has no transactions. Deleting it only removes it from your list.'
        }
        role="alertdialog"
        size="sm"
        footer={
          <>
            <Button onClick={() => setDeletingCategory(null)} disabled={isDeletingCategory} data-autofocus>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmCategoryDelete()}
              disabled={isDeletingCategory || (assignedCount > 0 && !reassignTo)}
            >
              <Trash2 className="size-3.5" />
              <span>
                {isDeletingCategory
                  ? 'Deleting…'
                  : assignedCount > 0
                    ? 'Reassign and delete'
                    : 'Delete category'}
              </span>
            </Button>
          </>
        }
      >
        {assignedCount > 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-soft/50 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-ink">
                These transactions will keep their amounts and dates, but move to the category you
                choose below.
              </p>
            </div>

            {fallbackCategories.length > 0 ? (
              <Field label="Move transactions to" htmlFor={reassignId} error={reassignError}>
                <select
                  id={reassignId}
                  value={reassignTo}
                  onChange={(event) => {
                    setReassignTo(event.target.value);
                    if (reassignError) setReassignError('');
                  }}
                  className={selectClass}
                >
                  {fallbackCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <p className="text-xs leading-relaxed text-expense">
                There is no other {deletingCategory?.type} category to move these transactions to.
                Create one first, then delete this category.
              </p>
            )}
            {reassignError && (
              <p role="alert" className="text-[11px] font-medium text-expense">
                {reassignError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-expense-soft text-expense"
              aria-hidden="true"
            >
              <AlertTriangle className="size-4" />
            </span>
            <p className="text-sm leading-relaxed text-muted">
              This cannot be undone, but your transactions are not affected because none use this
              category.
            </p>
          </div>
        )}
      </Modal>

      {/* Reset confirmation */}
      <Modal
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset all data?"
        description="This replaces the current ledger with the original sample data."
        role="alertdialog"
        size="sm"
        footer={
          <>
            <Button onClick={() => setIsResetOpen(false)} disabled={isResetting} data-autofocus>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleResetData()} disabled={isResetting}>
              <RotateCcw className="size-3.5" />
              <span>{isResetting ? 'Resetting…' : 'Reset data'}</span>
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-expense-soft text-expense"
            aria-hidden="true"
          >
            <AlertTriangle className="size-4" />
          </span>
          <div className="text-sm leading-relaxed text-muted">
            <p>
              All transactions, categories, and preferences in this browser will be replaced with
              the sample ledger.
            </p>
            <p className="mt-2 text-xs font-medium text-expense">
              Save a backup first if you want to keep the current data.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
