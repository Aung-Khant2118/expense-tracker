/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, duration = 3200 }) => {
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-rule bg-surface px-4 py-3 shadow-lg animate-toast-in motion-reduce:animate-none"
      >
        <span
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-income-soft text-income"
          aria-hidden="true"
        >
          <Check className="size-3.5 stroke-[2.5]" />
        </span>
        <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-ink">
          {toast.text}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
