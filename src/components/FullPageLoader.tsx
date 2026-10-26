/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { BrandMark } from './AppShell.tsx';

interface FullPageLoaderProps {
  label?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  label = 'Loading your ledger…',
}) => {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <BrandMark />
        <div className="flex items-center gap-2 text-xs text-muted" role="status" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
};
