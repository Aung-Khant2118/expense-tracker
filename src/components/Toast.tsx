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

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[calc(4rem+0.75rem)] z-[60] flex justify-center px-4 sm:bottom-6 sm:top-auto sm:justify-end sm:px-6">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-none border-2 border-ink bg-surface px-4 py-3 shadow-brutal animate-toast-in motion-reduce:animate-none"
      >
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-none border-2 border-ink bg-income-soft text-income"
          aria-hidden="true"
        >
          <Check className="size-3.5 stroke-[3]" />
        </span>
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-relaxed text-ink">
          {toast.text}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 shrink-0 rounded-none border-2 border-transparent p-1 text-muted transition-colors hover:border-ink hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
