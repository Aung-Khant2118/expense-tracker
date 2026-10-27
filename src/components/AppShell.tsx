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
} from 'lucide-react';
import { Button, cn } from './ui.tsx';

export type NavTab = 'dashboard' | 'transactions' | 'calendar' | 'reports' | 'settings';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="size-[18px]" /> },
  { id: 'transactions', label: 'Transactions', icon: <ReceiptText className="size-[18px]" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="size-[18px]" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="size-[18px]" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-[18px]" /> },
];

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-none border-2 border-ink bg-accent shadow-brutal-xs"
        aria-hidden="true"
      >
        <span className="font-display text-[17px] font-black leading-none text-accent-ink">
          F
        </span>
      </span>
      <span className="font-display text-[19px] font-black leading-none tracking-[-0.05em] text-ink">
        FinFlow
      </span>
    </span>
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[3px] border-ink bg-surface md:flex">
        <div className="border-b-[3px] border-ink px-4 py-5">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            aria-label="FinFlow overview"
            className="rounded-none text-left transition-transform hover:-translate-y-0.5"
          >
            <BrandMark />
          </button>
          <p className="mt-2 pl-[42px] font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-faint">
            Private ledger
          </p>
        </div>

        <div className="border-b-[3px] border-ink px-3 py-4">
          <Button variant="accent" size="md" onClick={onOpenAddModal} className="w-full">
            <Plus className="size-4 stroke-[2.5]" />
            <span>Add transaction</span>
          </Button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4"
        >
          <p className="px-2 pb-1 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-faint">
            Navigate
          </p>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-none border-2 px-3 py-2.5 text-left text-[13px] font-semibold transition-[background-color,color,border-color,transform,box-shadow] duration-100 active:translate-x-[2px] active:translate-y-[2px]',
                  active
                    ? 'border-ink bg-ink text-canvas shadow-brutal-xs'
                    : 'border-transparent text-ink hover:border-ink hover:bg-surface-2'
                )}
              >
                <span
                  className={cn(
                    'shrink-0',
                    active ? 'text-accent dark:text-canvas' : 'text-muted'
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span
                    className="ml-auto size-2 shrink-0 bg-accent dark:bg-canvas"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t-[3px] border-ink px-3 py-4">
          <Button
            variant="secondary"
            size="md"
            onClick={onToggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            className="w-full justify-start"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-canvas md:hidden">
        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            aria-label="FinFlow overview"
            className="shrink-0 rounded-none transition-transform hover:-translate-y-0.5"
          >
            <BrandMark />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="accent" size="sm" onClick={onOpenAddModal} className="h-9">
              <Plus className="size-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {children}

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
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
                  'relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-semibold transition-colors',
                  active ? 'bg-accent-soft/50 text-ink' : 'text-muted'
                )}
              >
                {active && (
                  <span
                    className="absolute inset-x-4 top-0 h-1 rounded-none bg-accent"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn('[&>svg]:size-4', active ? 'text-ink' : 'text-muted')}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
