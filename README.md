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

### Windows

Double-click `account.vbs` in the project folder. It starts `npm run dev` and opens Brave as an app window at `http://localhost:3001`. The script uses the folder it lives in (no hard-coded drive path).

## Running on Linux (Zorin OS)

Tested target: **Zorin OS 17** (Ubuntu 24.04 based). Windows launch via `account.vbs` is unchanged.

### Prerequisites

- **Node.js 18.17+** and **npm**
- A **PostgreSQL** database (local or remote)
- Optional for a nicer menu icon: ImageMagick (`convert`) or Python `pillow`

### Setup

1. Clone or copy the project, then create `.env.local` in the project root:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

2. Apply the SQL init scripts (same order as above / [docs/OPERATIONS.md](docs/OPERATIONS.md)).

3. Install dependencies once (also auto-runs if missing when you start):

```bash
npm install
```

4. Install the app-menu shortcut once:

```bash
chmod +x start-linux.sh stop-linux.sh install-linux-shortcut.sh
./install-linux-shortcut.sh
```

### Launch

- From the Zorin app menu: **Accountz**
- Or from a terminal in the project folder:

```bash
./start-linux.sh
```

`start-linux.sh` starts `npm run dev` on port **3001** (logs to `.accountz.log`), waits until the server responds, then opens an app-style browser window (Brave → Chrome → Chromium → `xdg-open`). If port 3001 is already in use, it only opens the browser. Closing the window does **not** stop the server.

Stop the server:

```bash
./stop-linux.sh
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

## Installable .deb package (Zorin OS / Ubuntu 24.04)

Build it (on Linux, from the repo root):

```bash
./packaging/build-deb.sh
```

This creates `dist/accountz_<version>_amd64.deb`. Bump `"version"` in `package.json` before each new release.

Install it on any Zorin OS 18 / Ubuntu 24.04 machine:

```bash
sudo apt install ./accountz_0.1.0_amd64.deb
```

The package:

- installs Node.js and PostgreSQL if missing
- creates a local `accountz` database with a random password (stored in `/etc/accountz/accountz.env`)
- creates/updates all tables
- runs the app as the `accountz` background service on http://localhost:3001 (starts on boot)
- adds **Accountz** to the app menu

Upgrade: install the newer `.deb` the same way; data is kept.
Uninstall: `sudo apt remove accountz` (data is kept). `sudo apt purge accountz` also removes the config; the database itself is never deleted automatically.

Service commands: `systemctl status accountz`, `sudo systemctl restart accountz`, `journalctl -u accountz`.

Do not install the .deb on a machine where you develop with `start-linux.sh` / `npm run dev`: both use port 3001 and the `accountz` database user.
