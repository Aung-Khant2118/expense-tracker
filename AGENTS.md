# AGENTS.md — FinFlow

FinFlow is a client-only React 19 + TypeScript SPA for personal expenses. There is no backend,
API, auth, or router. Product behavior and feature docs live in `README.md`.

## Commands

```bash
npm run dev      # Vite at http://localhost:3000, exposed on the LAN
npm run lint     # tsc --noEmit — the only static check; no ESLint/Prettier
npm test         # tsx tests/finance.test.ts — all tests in one process
npm run build    # static bundle into dist/
```

- `build` does not typecheck; run `npm run lint` separately.
- There is no CI or pre-commit automation. Run `lint` and `test` manually.
- On Windows PowerShell, `npm run clean` fails because it uses `rm -rf`; delete `dist/` manually.
- `DISABLE_HMR=true` disables Vite HMR and file watching in `vite.config.ts`; don't remove that branch.

## Architecture

- `src/App.tsx` owns navigation, selected month, modals, and toasts. Pages switch via `NavTab`
  state, not routes; a refresh resets the active page.
- `src/data/LedgerProvider.tsx` is the single React data layer (`useLedger()`): loading/error
  states, optimistic updates, and cross-tab refresh via `storage` events.
- `src/services/localLedger.ts` is the persistence boundary and implements `LedgerStore`.
  Keep ledger `localStorage` access out of components.
- `src/utils/finance.ts` holds pure calculation/date/currency helpers; `src/types/finance.ts`
  holds shared types. Keep business logic out of components.
- To add a page, extend `NavTab` and `NAV_ITEMS` in `src/components/AppShell.tsx`, then add the
  conditional render in `App.tsx`.
- Imports use relative paths with explicit `.ts`/`.tsx` extensions. The `@` alias maps to the
  repo root, not `src/`, and existing code does not use it.

## Data and storage gotchas

- Storage keys keep legacy `expense_tracker_*` names plus `ledger_theme_v1` even though the app
  is FinFlow. Renaming them silently orphans existing data; keep them.
- Theme is applied by the inline script in `index.html` (pre-paint) and by an effect in
  `App.tsx`; keep both in sync.
- `transactionDate` is local `YYYY-MM-DD`, and month filtering is a string-prefix match. Use
  `toISODate()` rather than `toISOString()` for calendar dates; the latter is fine for
  `createdAt`/`updatedAt` timestamps.
- Amounts are normalized with `Math.abs` before storage.
- Currency switching is display-only (`formatCurrency`); never convert stored amounts.
- Deleting a category with transactions requires a reassignment target;
  `deleteLocalCategory` rejects it otherwise.
- Seed data is hard-coded to 2026 dates and is written only when storage keys are absent.

## UI conventions

- Tailwind CSS 4 via `@tailwindcss/vite`; there is no `tailwind.config`. Tokens live in
  `src/index.css` (`@theme inline` + CSS variables). Prefer semantic classes such as
  `bg-canvas`, `bg-surface`, `text-ink`, `text-muted`, `border-rule`, `text-income`,
  `text-expense`, and `bg-accent-soft` over raw colors. Dark mode uses the `.dark` variant.
- Reuse `src/components/ui.tsx` primitives (`Button`, `Modal`, `Field`, `Panel`,
  `SegmentedControl`, `cn`, `inputClass`, `selectClass`) instead of one-off styling.
- Icons are from `lucide-react`; category icon keys must exist in `AVAILABLE_ICONS`
  (`src/components/CategoryIcon.tsx`).
- Report charts are hand-written SVG; there is no charting library.
- Source files carry an `SPDX-License-Identifier: Apache-2.0` header.

## Tests

- There is no test framework: `tests/finance.test.ts` is a set of top-level assertion blocks
  using `node:assert/strict`. Add new cases as new blocks; run with `npx tsx tests/finance.test.ts`.
- Pass explicit reference dates to date-sensitive helpers so results are deterministic.

## Unused starter dependencies

`express`, `@google/genai`, `@types/express`, and `dotenv` are unused leftovers from the
AI Studio starter. The app is fully static; don't assume server code exists or should be added.
