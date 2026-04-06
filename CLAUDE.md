# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CashBook v2 — Offline-First Finance App

A premium offline-first personal finance app built with Expo + TypeScript + SQLite. All data is stored locally on the device.

---

## Key Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Start and connect to Android device/emulator
npm run ios            # Start and connect to iOS simulator
npm run web            # Start web build

# Building (requires EAS CLI)
eas build --platform android --profile preview   # Build APK
eas build --platform android --profile production # Build App Bundle

# Adding packages (use npx expo install for compatible versions)
npx expo install <package-name>
```

---

## Architecture

### Data Flow (Offline-First)

```
App Start → Initialize SQLite → Load FinanceContext → Render UI
User Action → SQLite mutation → Context refresh → UI auto-updates
```

All financial data flows through SQLite. The `FinanceContext` acts as a bridge between raw DB queries and React components — it loads data on mount and refreshes after every mutation. Context consumers automatically re-render.

### Directory Structure

```
app/                  # Expo Router file-based routing
  (tabs)/             # Bottom tab navigator screens
    dashboard.tsx     # Balance overview + recent transactions
    transactions.tsx  # Full transaction list with month filter + FAB
    goals.tsx         # Savings goals with progress tracking
    settings.tsx      # App lock toggle, PDF export, about info
  _layout.tsx         # Root layout (providers + stack)
  +not-found.tsx

components/
  ui/                 # Shared design system (Button, Card, Input, Modal, Badge)
  finance/            # Business components (TransactionItem, TransactionForm, BalanceCard)
  goals/              # Goal components (GoalCard, GoalForm, ContributionForm)

contexts/
  FinanceContext.tsx  # All finance state + CRUD functions synced with SQLite
  AppLockContext.tsx  # Biometric auth state and lock control

lib/
  db/sqlite.ts        # DB initialization and table creation
  db/queries.ts       # All CRUD query helpers (parameterized SQL only)
  constants.ts        # Colors, spacing, categories, CATEGORY_COLORS map
  format.ts           # Currency (USD) and date formatting helpers
  utils.ts            # Utility functions
```

### Key Patterns

- **No backend**: All data in Expo SQLite. Never add Supabase, API calls, or cloud sync unless explicitly requested.
- **Context + hooks only**: No Redux/Zustand. State management uses React Context with custom hooks (`useFinance`, `useAppLock`).
- **Parameterized queries**: All SQL queries in `queries.ts` use `?` placeholders. Never concatenate user input into SQL strings.
- **Modal forms**: Add/Edit forms open in `AppModal` (bottom sheet). Contribution forms use the separate `ContributionForm` component with `Alert.prompt`.
- **Month-based filtering**: Transactions screen filters by month key (`YYYY-MM`). Use `getMonthKey()` and `getAdjacentMonths()` from `lib/format.ts`.

---

## Database Schema

### transactions
```
id TEXT PRIMARY KEY,
type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
amount REAL NOT NULL,
category TEXT NOT NULL,
note TEXT DEFAULT '',
date TEXT NOT NULL
```

### goals
```
id TEXT PRIMARY KEY,
title TEXT NOT NULL,
targetAmount REAL NOT NULL,
savedAmount REAL NOT NULL DEFAULT 0,
emoji TEXT DEFAULT '🎯'
```

---

## Design System

- **Colors**: `lib/constants.ts` — `COLORS` object with primary, accent, income (green), expense (red), semantic backgrounds
- **Font**: System default (Inter not yet bundled — consider adding as future enhancement)
- **Spacing**: 8px grid (`SPACING` in constants.ts)
- **Cards**: 16px border radius, white background, subtle border
- **Buttons**: Primary (blue solid), Secondary (blue light), Ghost (transparent)
- **Typography**: 28/24/20/18/16/14 scale with fontWeight 500/600/700

---

## Build Configuration

- `eas.json` has three profiles: `development` (dev client), `preview` (APK), `production` (App Bundle)
- `app.json` configured for `com.cashbook.app` package name
- Biometric auth requires no additional Android config on modern Expo
