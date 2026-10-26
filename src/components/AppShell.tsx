/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  CalendarDays,
  BarChart3,
  Settings,
  Plus,
  Moon,
  Sun,
  HardDrive,
} from 'lucide-react';
import { Button, IconButton, cn } from './ui.tsx';

export type NavTab = 'dashboard' | 'transactions' | 'calendar' | 'reports' | 'settings';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="size-[17px]" /> },
  { id: 'transactions', label: 'Transactions', icon: <ReceiptText className="size-[17px]" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="size-[17px]" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="size-[17px]" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-[17px]" /> },
];

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export function BrandMark({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'relative grid size-9 shrink-0 place-items-center rounded-lg',
          inverse ? 'bg-sidebar-active' : 'bg-ink'
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute inset-y-2 left-2 w-px',
            inverse ? 'bg-accent' : 'bg-accent'
          )}
        />
        <span className="ml-1 space-y-[3px]">
          <span className={cn('block h-px w-4', inverse ? 'bg-sidebar-ink/80' : 'bg-canvas/85')} />
          <span className={cn('block h-px w-4', inverse ? 'bg-sidebar-ink/80' : 'bg-canvas/85')} />
          <span className={cn('block h-px w-2.5', inverse ? 'bg-sidebar-ink/45' : 'bg-canvas/50')} />
        </span>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-display text-[19px] font-semibold leading-none tracking-tight',
            inverse ? 'text-sidebar-ink' : 'text-ink'
          )}
        >
          FinFlow
        </span>
        <span
          className={cn(
            'mt-1 block truncate text-[10px] leading-none',
            inverse ? 'text-sidebar-muted' : 'text-muted',
            compact && 'hidden sm:block'
          )}
        >
          Personal expense tracker
        </span>
      </span>
    </div>
  );
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  theme,
  onToggleTheme,
  children,
}) => {
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-ink md:flex">
        <div className="px-5 pb-5 pt-6">
          <BrandMark inverse />
        </div>

        <div className="px-3">
          <Button
            variant="accent"
            size="lg"
            onClick={onOpenAddModal}
            className="w-full justify-start px-3"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add transaction</span>
          </Button>
        </div>

        <nav aria-label="Main navigation" className="mt-7 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-sidebar-active text-sidebar-ink'
                    : 'text-sidebar-muted hover:bg-sidebar-active/70 hover:text-sidebar-ink'
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                )}
                <span className="shrink-0 opacity-90">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-rule p-4">
          <p className="text-[11px] leading-relaxed text-sidebar-muted">
            Your data stays in this browser. Back it up from Settings.
          </p>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={themeLabel}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-ink"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-rule bg-canvas/95 px-4 backdrop-blur md:hidden">
        <BrandMark compact />
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] text-muted"
            title="Data stays in this browser"
          >
            <HardDrive className="size-3.5" aria-hidden="true" />
            Local
          </span>
          <IconButton label={themeLabel} onClick={onToggleTheme} className="size-9">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <Button variant="accent" size="sm" onClick={onOpenAddModal} className="h-9 px-3">
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add</span>
          </Button>
        </div>
      </header>

      {children}

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-ink' : 'text-muted'
                )}
              >
                {active && (
                  <span
                    className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-accent"
                    aria-hidden="true"
                  />
                )}
                <span className={active ? 'opacity-100' : 'opacity-75'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
