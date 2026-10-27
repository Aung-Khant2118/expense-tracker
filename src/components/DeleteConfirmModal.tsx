/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from './ui.tsx';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete permanently',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Could not complete this action. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      role="alertdialog"
      size="sm"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting} data-autofocus>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            <Trash2 className="size-3.5" />
            <span>{isSubmitting ? 'Deleting…' : confirmLabel}</span>
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-none border-2 border-ink bg-expense-soft text-expense"
            aria-hidden="true"
          >
            <AlertTriangle className="size-4" />
          </span>
          <p className="text-sm leading-relaxed text-muted">{message}</p>
        </div>
        {error && (
          <p role="alert" className="rounded-none border-2 border-ink bg-expense-soft px-3 py-2 text-[11px] font-medium text-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
};
