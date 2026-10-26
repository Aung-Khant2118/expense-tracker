/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useId, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types/finance.ts';
import { CURRENCIES, toISODate } from '../utils/finance.ts';
import { CategoryAvatar } from './CategoryIcon.tsx';
import {
  Button,
  Field,
  Modal,
  cn,
  inputClass,
  selectClass,
} from './ui.tsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  currency: string;
  defaultDate?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'Mobile Wallet',
  'Credit Card',
  'Debit Card',
  'Other',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  categories,
  currency,
  defaultDate,
}) => {
  const isEditing = Boolean(transactionToEdit);

  const formId = useId();
  const amountId = useId();
  const dateId = useId();
  const paymentId = useId();
  const descriptionId = useId();
  const categoryGroupId = useId();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('Cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCategories = categories.filter((category) => category.type === type);
  const currencySymbol = CURRENCIES[currency]?.symbol || currency;

  useEffect(() => {
    if (!isOpen) return;

    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategoryId(transactionToEdit.categoryId);
      setDate(transactionToEdit.transactionDate);
      setDescription(transactionToEdit.description || '');
      setPaymentMethod(transactionToEdit.paymentMethod || '');
    } else {
      setType('expense');
      setAmount('');
      setDate(defaultDate || toISODate());
      setDescription('');
      setPaymentMethod('Cash');

      const firstExpense = categories.find((category) => category.type === 'expense');
      setCategoryId(firstExpense?.id || '');
    }

    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, transactionToEdit, defaultDate, categories]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);

    const validCategories = categories.filter((category) => category.type === nextType);
    if (!validCategories.some((category) => category.id === categoryId)) {
      setCategoryId(validCategories[0]?.id || '');
    }

    setErrors((previous) => ({ ...previous, category: '' }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Enter an amount greater than zero.';
    }

    if (!categoryId) {
      nextErrors.category = 'Choose a category.';
    }

    if (!date) {
      nextErrors.date = 'Choose a date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      onSave(
        {
          userId: transactionToEdit?.userId || 'default-user',
          type,
          amount: parsedAmount,
          categoryId,
          transactionDate: date,
          description: description.trim() || undefined,
          paymentMethod: paymentMethod || undefined,
        },
        transactionToEdit?.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit transaction' : 'New transaction'}
      description={
        isEditing
          ? 'Update this entry. Monthly totals recalculate immediately.'
          : 'Record an income or expense. It appears in the ledger right away.'
      }
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            disabled={isSubmitting}
          >
            {isEditing ? 'Save changes' : 'Add transaction'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink">Type</span>
          <div
            className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-0.5"
            role="group"
            aria-label="Transaction type"
          >
            <button
              type="button"
              aria-pressed={type === 'expense'}
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors',
                type === 'expense'
                  ? 'bg-surface text-expense'
                  : 'text-muted hover:text-ink'
              )}
            >
              <ArrowUpRight className="size-4" aria-hidden="true" />
              Expense
            </button>
            <button
              type="button"
              aria-pressed={type === 'income'}
              onClick={() => handleTypeChange('income')}
              className={cn(
                'flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors',
                type === 'income' ? 'bg-surface text-income' : 'text-muted hover:text-ink'
              )}
            >
              <ArrowDownLeft className="size-4" aria-hidden="true" />
              Income
            </button>
          </div>
        </div>

        <Field label={`Amount (${currency})`} htmlFor={amountId} required error={errors.amount}>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-faint"
              aria-hidden="true"
            >
              {currencySymbol}
            </span>
            <input
              id={amountId}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                if (errors.amount) setErrors((previous) => ({ ...previous, amount: '' }));
              }}
              placeholder={CURRENCIES[currency]?.decimals === 0 ? '0' : '0.00'}
              aria-invalid={Boolean(errors.amount)}
              className={cn(
                inputClass,
                'h-11 pl-12 font-mono text-base font-medium tabular-nums',
                errors.amount && 'border-expense'
              )}
              data-autofocus
            />
          </div>
        </Field>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span id={categoryGroupId} className="text-xs font-semibold text-ink">
              Category <span className="text-expense">*</span>
            </span>
            <span className="text-[10px] text-faint">
              {availableCategories.length}{' '}
              {availableCategories.length === 1 ? 'option' : 'options'}
            </span>
          </div>

          <div
            role="group"
            aria-labelledby={categoryGroupId}
            className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-rule bg-surface-2/30 p-1.5 sm:grid-cols-2"
          >
            {availableCategories.map((category) => {
              const selected = categoryId === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setCategoryId(category.id);
                    if (errors.category) {
                      setErrors((previous) => ({ ...previous, category: '' }));
                    }
                  }}
                  className={cn(
                    'flex min-h-9 items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-colors',
                    selected
                      ? 'border-ink bg-surface text-ink'
                      : 'border-transparent text-muted hover:bg-surface hover:text-ink'
                  )}
                >
                  <CategoryAvatar category={category} size="sm" />
                  <span className="truncate">{category.name}</span>
                  {selected && <Check className="ml-auto size-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}

            {availableCategories.length === 0 && (
              <p className="col-span-full px-2 py-3 text-xs text-faint">
                No {type} categories yet. Add one in Settings.
              </p>
            )}
          </div>

          {errors.category && (
            <p className="mt-1 text-[11px] font-medium text-expense" role="alert">
              {errors.category}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor={dateId} required error={errors.date}>
            <input
              id={dateId}
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                if (errors.date) setErrors((previous) => ({ ...previous, date: '' }));
              }}
              aria-invalid={Boolean(errors.date)}
              className={cn(
                inputClass,
                'font-mono text-xs',
                errors.date && 'border-expense'
              )}
            />
          </Field>

          <Field label="Payment method" htmlFor={paymentId}>
            <select
              id={paymentId}
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod | '')
              }
              className={selectClass}
            >
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Note"
          htmlFor={descriptionId}
          hint="Optional. A short reminder of what this was for."
        >
          <input
            id={descriptionId}
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Groceries, rent, salary…"
            className={inputClass}
          />
        </Field>
      </form>
    </Modal>
  );
};
