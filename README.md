# Ledger — Personal Expense Tracker

A private, local-first expense tracker for daily transactions, monthly balances, and spending patterns. Everything runs in the browser and is stored in `localStorage` — there is no account, backend, or sync service.

Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

### Overview

- Monthly income, expenses, and balance ("money left") for the selected month.
- Previous-month comparison for income, expenses, and net balance.
- Daily average spending, days elapsed, and largest expense category.
- Income vs. expenses summary and expense breakdown by category.
- Recent transactions with quick edit and delete actions.

### Transactions

- Add income or expense entries with amount, category, date, payment method, and an optional note.
- Search notes, categories, and amounts.
- Filter by type, category, payment method, month, or custom date range.
- Sort by date or amount, with pagination and filtered totals.
- Export the current filtered view to CSV.

### Calendar

- Month grid showing daily income, expense, and transaction counts.
- Select a day to view its entries, add a transaction for that date, or edit/delete existing ones.
- Configurable week start (Monday or Sunday).

### Reports

- Annual cash-flow chart with monthly income and expenses.
- Side-by-side comparison of any two months, including per-category changes.
- Cumulative spending chart showing how expenses accumulated through the month.

### Settings

- Light and dark themes.
- 11 display currencies: MMK, USD, EUR, GBP, SGD, THB, JPY, CAD, AUD, INR, CNY.
- Currency formatting is display-only; stored amounts never change.
- Create, edit, recolor, and delete income/expense categories with icons.
- Deleting a category that has transactions requires reassigning them first.
- Export all data as a JSON backup, restore from JSON, export transactions as CSV, or reset to the sample ledger.

## Tech stack

| Layer      | Tools                                                        |
| ---------- | ------------------------------------------------------------ |
| UI         | React 19, TypeScript, lucide-react icons                     |
| Build      | Vite 8, `@vitejs/plugin-react`                               |
| Styling    | Tailwind CSS 4 with CSS custom properties for theming        |
| State      | React state, with a small `localStorage` store and listeners |
| Tests      | Node's `assert` via `tsx`                                    |
| Fonts      | Bricolage Grotesque, Public Sans, JetBrains Mono (Google Fonts) |

## Getting started

### Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm

### Install and run

```bash
npm install
npm run dev
```

The dev server listens on **http://localhost:3000** and is exposed on the local network (`--host 0.0.0.0`).

On first launch the app seeds a sample ledger so every screen has data to show. You can replace it via **Settings → Reset data**.

### Build for production

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Available scripts

| Script            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 3000               |
| `npm run build`   | Build the production bundle into `dist/`             |
| `npm run preview` | Serve the production build locally                   |
| `npm run lint`    | Type-check the project with `tsc --noEmit`           |
| `npm test`        | Run the financial calculation test suite with `tsx`  |
| `npm run clean`   | Remove `dist/` and `server.js`                       |

> `npm run clean` uses `rm -rf`, so it needs a POSIX-style shell. On Windows, delete `dist` manually or run it from Git Bash/WSL.

## Project structure

```text
expense-tracker/
├─ index.html                 # App shell, fonts, theme bootstrap
├─ metadata.json              # App metadata
├─ vite.config.ts             # Vite, React, Tailwind, path alias
├─ tsconfig.json
├─ package.json
├─ src/
│  ├─ main.tsx                # React entry point
│  ├─ App.tsx                 # App state, routing between pages, modals
│  ├─ index.css               # Tailwind import, design tokens, themes
│  ├─ components/
│  │  ├─ AppShell.tsx         # Sidebar, mobile navigation, header
│  │  ├─ ui.tsx               # Shared Button, Modal, Field, Panel, etc.
│  │  ├─ DashboardPage.tsx
│  │  ├─ SummaryCards.tsx
│  │  ├─ IncomeVsExpensesChart.tsx
│  │  ├─ CategoryBreakdownChart.tsx
│  │  ├─ RecentTransactionsList.tsx
│  │  ├─ MonthSelector.tsx
│  │  ├─ TransactionsPage.tsx
│  │  ├─ TransactionModal.tsx
│  │  ├─ DeleteConfirmModal.tsx
│  │  ├─ CalendarPage.tsx
│  │  ├─ ReportsPage.tsx
│  │  ├─ SettingsPage.tsx
│  │  └─ CategoryIcon.tsx
│  ├─ services/
│  │  ├─ storage.ts           # localStorage CRUD, import/export, subscriptions
│  │  └─ defaultData.ts       # Default categories, settings, sample transactions
│  ├─ types/
│  │  └─ finance.ts           # Transaction, Category, summary, and chart types
│  └─ utils/
│     └─ finance.ts           # Pure calculation, date, and currency helpers
└─ tests/
   └─ finance.test.ts         # Financial calculation tests
```

## How the data works

All application data lives in the browser under three `localStorage` keys:

| Key                                 | Contents                                  |
| ----------------------------------- | ----------------------------------------- |
| `expense_tracker_transactions_v1`   | Income and expense entries                |
| `expense_tracker_categories_v1`     | Income and expense categories             |
| `expense_tracker_settings_v1`       | Theme, currency, and week-start preference |

`src/services/storage.ts` is the only module that touches storage. It exposes CRUD helpers for transactions and categories, plus `subscribeToStorage` so the UI reloads when data changes. React state is hydrated from storage on startup.

Key calculations are pure functions in `src/utils/finance.ts`:

- Monthly balance = total income − total expenses.
- Expense percentage = expenses ÷ income (returns `null` rather than `NaN` when income is zero).
- Daily average = expenses ÷ elapsed days (current month) or ÷ total days (past month).
- Month filtering uses the ISO `YYYY-MM-DD` transaction date, avoiding timezone drift.
- Currency switching changes formatting only.

## Data, privacy, and backups

- Nothing is sent to a server. There is no analytics, authentication, or network persistence.
- Data is scoped to the current browser and origin. Clearing site data or using private browsing deletes it.
- Data does **not** sync across devices or browsers.
- Use **Settings → Save a full backup** to download a JSON archive containing transactions, categories, and preferences.
- Use **Settings → Restore from a backup** to load a JSON archive. Importing replaces the current data in that browser.
- Use **Export CSV** for a spreadsheet-friendly copy of transactions.

> The project ships `.env.example` from its AI Studio template. The current app is fully client-side and needs no environment variables; `GEMINI_API_KEY` and `APP_URL` are unused. The only variable the tooling reads is the optional `DISABLE_HMR` flag in `vite.config.ts`, which disables HMR and file watching.

## Tests

```bash
npm test
```

The suite covers:

1. Standard monthly income, expenses, and balance math.
2. Deficit handling and zero-division safety.
3. Month boundary filtering, including leap years.
4. Daily average spending based on elapsed days.
5. Currency formatting with sign preservation.

## Notes and limitations

- Single-user by design; no authentication or multi-user support.
- No recurring transactions, budgets, or attachment uploads yet.
- Charts are hand-built SVG components, so no charting library is required.
- The package name in `package.json` is still the template default (`react-example`); the product name shown in the UI is **Ledger**.

## License

Source files include `SPDX-License-Identifier: Apache-2.0` headers. The repository does not currently include a `LICENSE` file — add one before distributing the project if you need the full license text.
