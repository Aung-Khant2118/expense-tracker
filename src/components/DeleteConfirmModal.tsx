/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from './ui.tsx';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      role="alertdialog"
      size="sm"
      footer={
        <>
          <Button onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 className="size-3.5" />
            <span>{confirmLabel}</span>
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
        <p className="text-sm leading-relaxed text-muted">{message}</p>
      </div>
    </Modal>
  );
};
