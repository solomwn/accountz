# Technical Guide — Accountz

Architecture and implementation notes derived from the current repository. Paths are relative to the repo root unless absolute.

---

## 1. Architecture overview

```
Browser (React client components)
        │
        ▼
Next.js App Router pages (RSC)  ──►  src/app/actions.ts  ("use server")
        │                                    │
        │                                    ▼
        │                              PostgreSQL (pg Pool in db.ts)
        ▼
UI components under src/components/
```

- **No REST API routes** under `src/app/api` (none present).
- **No middleware** / auth layer.
- Data mutations and queries are **Next.js Server Actions** in `src/app/actions.ts`.
- Connection: `db.ts` exports `pool = new Pool({ connectionString: process.env.DATABASE_URL })`.

---

## 2. Project structure (important paths)

```
accountz/
├── db.ts                          # pg Pool
├── *.sql                          # Manual schema init / additive migrations
├── package.json
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Shell, ThemeProvider, metadata
│   │   ├── page.tsx               # Redirect → /dashboard
│   │   ├── actions.ts             # All server actions
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── budgets/page.tsx
│   │   └── reports/page.tsx
│   ├── components/
│   │   ├── layout/                # AppShell, sidebar, headers
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/               # Includes custom BudgetCalendar
│   │   ├── reports/               # ReportsView, YearlyMatrix
│   │   └── ui/                    # Shared primitives
│   └── lib/
│       ├── schema-compat.ts       # account_type detection / normalize
│       ├── format.ts
│       ├── category-utils.ts
│       ├── dashboard-metrics.ts
│       └── mock-dashboard-data.ts # Mock user greeting data
└── docs/
```

---

## 3. Routes and pages

| Route | Page module | Primary data loaders |
|-------|-------------|----------------------|
| `/` | `src/app/page.tsx` | Redirect to `/dashboard` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Summary, cash flow, spending, bills, etc. |
| `/transactions` | `src/app/transactions/page.tsx` | `getTransactions`, `getAccounts`, `getCategories` |
| `/accounts` | `src/app/accounts/page.tsx` | `getAccountBalances`, `getTransactions`, `getSchemaCapabilities` |
| `/categories` | `src/app/categories/page.tsx` | Categories CRUD data |
| `/budgets` | `src/app/budgets/page.tsx` | Budgets + scheduled bills + `BudgetCalendar` |
| `/reports` | `src/app/reports/page.tsx` | `getReportData` / `getYearlyMatrixData` by query params |

Query params for reports: `month`, `year`, `view` (`monthly` \| `yearly-group` \| `yearly-category`).

---

## 4. Domain model

### Transaction types

`Transaction.type`: `"income" | "expense" | "transfer"`.

- Income/expense: `account_id`, `category_id`.
- Transfer: single row with `account_id` (source), `to_account_id` (destination), category forced to Transfer.
- `updateTransaction` rejects transfers: `"Editing transfers is not supported yet."`

### Account balances

Computed in `getAccountBalances`:

```
opening_balance
  + SUM(income on account)
  − SUM(expense on account)
  − SUM(transfers out)
  + SUM(transfers in)
```

### Account types (optional schema)

- Types: `"asset" | "liability"` (`src/lib/schema-compat.ts`).
- `supportsAccountType()` checks `information_schema` for `accounts.account_type` (cached).
- Debt / loan principal reporting: transfers **into** accounts with `account_type = 'liability'`.
- Helpers that must not crash the app when schema is missing:
  - `isDebtPaymentReportingAvailable`
  - `getMonthlyDebtPaymentReporting`
  - `getYearlyDebtPaymentMatrixRows`
  - `getYearlyDebtPaymentsByMonth`
- Reports expose `supportsDebtPaymentReporting`; UI hides loan sections when false.

### Scheduled bills

Table `scheduled_bills`. Paying via `payScheduledBill(billId, accountId)` inserts an expense and sets `is_paid = true`. `markScheduledBillAsPaid` marks paid without creating a transaction.

### Calendar implementation

**Not FullCalendar.** Custom grid in `src/components/budgets/budget-calendar.tsx` (`buildCalendarGrid`, Monday start, 42 cells) and similar helpers in `upcoming-agenda.tsx`.

---

## 5. Database schema and migrations

There is **no** migration runner (no Prisma Migrate, Knex, Flyway, etc.). Schema is applied by running root-level SQL files manually against PostgreSQL.

| File | Effect |
|------|--------|
| `init.sql` | `transactions` + `pgcrypto` |
| `accounts-init.sql` | `accounts`; `transactions.account_id` |
| `categories-init.sql` | `categories`; FKs / backfill |
| `category-groups-init.sql` | `categories.group_name` |
| `transfers-init.sql` | `transactions.to_account_id`; Transfer category seed |
| `budget-init.sql` | `budgets` |
| `scheduled-bills-init.sql` | `scheduled_bills` |
| `scheduled-bills-account-init.sql` | bill `account_id` adjustments if present |
| `account-types-init.sql` | `accounts.account_type` (default `asset`) |

### Logical relationships

- `transactions.account_id` → `accounts.id`
- `transactions.to_account_id` → `accounts.id` (transfers)
- `transactions.category_id` → `categories.id`
- `budgets.category_id` → `categories.id`
- `scheduled_bills.category_id` → `categories.id`
- `scheduled_bills.account_id` → `accounts.id`

---

## 6. Authentication and authorization

**Not implemented.**

- No login page, session, JWT, NextAuth, Clerk, or role checks.
- Dashboard greeting may use mock user data from `src/lib/mock-dashboard-data.ts`.
- Anyone who can reach the deployed URL can use the app as implemented.

---

## 7. Environment variables

| Name | Purpose | Used in |
|------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string for `pg.Pool` | `db.ts` |

No other application env vars are referenced under `src/`.  
No `.env.example` is committed. Use a local `.env.local` with placeholders only in docs:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Do not** commit real credentials.

---

## 8. Key server actions (`src/app/actions.ts`)

| Area | Functions (representative) |
|------|----------------------------|
| Transactions | `getTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `getRecentPayees` |
| Accounts | `getAccounts`, `getAccountBalances`, `createAccount`, `updateAccount`, `deleteAccount`, `getSchemaCapabilities` |
| Categories | `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| Budgets | `getBudgets`, `createBudget`, `updateBudget`, `deleteBudget`, `getGlobalTargets` |
| Bills | `getScheduledBillsForMonth`, `createScheduledBill`, `updateScheduledBill`, `deleteScheduledBill`, `payScheduledBill`, `markScheduledBillAsPaid`, `getUnpaidScheduledBillsThisMonth`, `getDueSoonScheduledBills` |
| Dashboard | `getDashboardSummary`, `getMonthlyComparison`, `getExpensesByCategory`, `getIncomeByCategory`, `getYearlyCashFlow`, `getSpendingByGroupThisMonth`, … |
| Reports | `getReportData`, `getYearlyMatrixData` |

Errors for optional loan queries are logged with `logDbError` / `[schema-compat]` messages and degrade to empty debt series rather than failing the whole report when isolated correctly.

Path revalidation helpers such as `revalidateTransactionPages` call `revalidatePath` for affected routes after mutations.

---

## 9. SMS / reminders / cron / external services

| Capability | Status in repo |
|------------|----------------|
| SMS provider (Twilio, etc.) | **Not present** |
| Cron / scheduled HTTP endpoints | **Not present** |
| `vercel.json` cron | **Not present** |
| Neon-specific SDK | **Not present** (generic Postgres URL) |
| Email provider | **Not present** |

In-app “reminders” are UI banners for unpaid/due **scheduled bills** (`bill-reminder-banner.tsx` and related dashboard data), not outbound messages.

---

## 10. Dependencies (selected)

From `package.json`:

- Runtime: `next@14.2.35`, `react`/`react-dom` ^18, `pg`, `recharts`, Radix packages, `lucide-react`, `sonner`, `next-themes`, Tailwind-related utilities, `shadcn` CLI package.
- Dev: TypeScript, ESLint (`eslint-config-next`), Tailwind, `@types/pg`.

Charts use **Recharts** in `src/components/reports/reports-view.tsx` (and dashboard chart components as applicable).

---

## 11. Schema compatibility layer

`src/lib/schema-compat.ts`:

- `hasColumn(table, column)` — cached `information_schema` lookup
- `supportsAccountType()` — whether `accounts.account_type` exists
- `normalizeAccountType(value)` — invalid/null → `"asset"`

Account create/update in `actions.ts` branches SQL to include or omit `account_type` based on that check so older databases can still run.
