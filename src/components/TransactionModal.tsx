/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Transaction, Category, TransactionType, PaymentMethod } from '../types/finance.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

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

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('Cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available categories based on selected transaction type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString());
        setCategoryId(transactionToEdit.categoryId);
        setDate(transactionToEdit.transactionDate);
        setDescription(transactionToEdit.description || '');
        setPaymentMethod(transactionToEdit.paymentMethod || 'Cash');
      } else {
        const todayStr = defaultDate || new Date().toISOString().split('T')[0];
        setType('expense');
        setAmount('');
        setDate(todayStr);
        setDescription('');
        setPaymentMethod('Cash');
        // Pre-select first category for default type
        const firstExp = categories.find((c) => c.type === 'expense');
        setCategoryId(firstExp ? firstExp.id : '');
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, transactionToEdit, defaultDate, categories]);

  // When changing type, update category selection if current category does not match new type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = categories.filter((c) => c.type === newType);
    if (!validCats.some((c) => c.id === categoryId)) {
      setCategoryId(validCats[0]?.id || '');
    }
    // Clear type error if any
    setErrors((prev) => ({ ...prev, category: '' }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    // Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero.';
    }

    // Validate Category
    if (!categoryId) {
      newErrors.category = 'Category is required.';
    }

    // Validate Date
    if (!date) {
      newErrors.date = 'Date is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
          paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
        },
        transactionToEdit ? transactionToEdit.id : undefined
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Segmented Control for Income / Expense */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl font-mono text-base font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  errors.amount ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                errors.category ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="" disabled>
                Select a category
              </option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-rose-500 mt-1">{errors.category}</p>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.date ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.date && (
              <p className="text-xs text-rose-500 mt-1">{errors.date}</p>
            )}
          </div>

          {/* Payment Method (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method (Optional)
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Description / Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly organic market groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
