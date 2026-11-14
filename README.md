# Accountz (My Finances)

Personal finance tracker for recording income, expenses, and transfers across accounts; managing categories and budgets; tracking scheduled bills; and reviewing monthly/yearly reports.

Brand label in the sidebar: **My Finances**. App metadata title: **Personal Finance Tracker**.

This repository is **not** a salon booking, CRM, or appointment product. Features such as clients, SMS reminders, and staff calendars are not implemented.

## Technology stack (verified)

| Layer | Technology |
|-------|------------|
| Framework | [Next.js](https://nextjs.org/) 14 (App Router) |
| UI | React 18, Tailwind CSS, Radix UI, Lucide icons, Sonner toasts |
| Charts | Recharts |
| Database | PostgreSQL via the `pg` Pool (`db.ts`) |
| Language | TypeScript |

There is no ORM. Server logic lives mainly in `src/app/actions.ts` (`"use server"`).

## Main implemented features

- **Dashboard** — cash flow, spending by category/group, budget summary, unpaid bills
- **Transactions** — income, expense, and account-to-account transfers
- **Accounts** — balances from opening balance + transaction deltas; optional **Asset** / **Loan / Liability** types when the DB schema supports `account_type`
- **Categories** — income/expense categories with colors and optional group names
- **Budgets** — category budgets plus a custom monthly **scheduled bills** calendar
- **Reports** — monthly overview (income/expense KPIs, charts) and yearly expense matrices; optional **Loan Principal Paid** when liability accounts exist

**Not implemented:** authentication, API routes, Goals page (sidebar link is a stub), SMS, cron jobs, Vercel project config in-repo.

## Quick start (local)

Requirements: Node.js, npm, and a PostgreSQL database.

1. Install dependencies:

```bash
npm install
```

2. Create an environment file (do not commit secrets):

```bash
# .env.local
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

3. Apply SQL init scripts to your database in dependency order (see [docs/OPERATIONS.md](docs/OPERATIONS.md)). Example:

```bash
psql "$DATABASE_URL" -f init.sql
psql "$DATABASE_URL" -f accounts-init.sql
psql "$DATABASE_URL" -f categories-init.sql
psql "$DATABASE_URL" -f category-groups-init.sql
psql "$DATABASE_URL" -f transfers-init.sql
psql "$DATABASE_URL" -f budget-init.sql
psql "$DATABASE_URL" -f scheduled-bills-init.sql
psql "$DATABASE_URL" -f scheduled-bills-account-init.sql
psql "$DATABASE_URL" -f account-types-init.sql
```

4. Start the development server (port **3001**, from `package.json`):

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The home route redirects to `/dashboard`.

Other scripts:

```bash
npm run build   # production build
npm run start   # run production server (default Next port 3000 unless configured)
npm run lint    # ESLint
```

## Documentation

| Document | Audience | Contents |
|----------|----------|----------|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | End users | How to use Accounts, Transactions, Budgets, Reports |
| [docs/TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md) | Developers | Architecture, schema, actions, env vars |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Operators | Local setup, migrations, deploy notes, troubleshooting |
| [docs/VERIFICATION_NEEDED.md](docs/VERIFICATION_NEEDED.md) | Everyone | Items that cannot be confirmed from the repo alone |

## License / privacy

This project is marked `"private": true` in `package.json`. Do not commit `.env.local` or real credentials.
