# Operations Guide — Accountz

Local development, schema application, deployment notes, and troubleshooting.  
Production hosting (Vercel/Neon/schedulers) is **not configured in this repository**; treat those sections as guidance, not verified live setup.

---

## 1. Local development setup

### Prerequisites

- Node.js (compatible with Next.js 14)
- npm
- PostgreSQL reachable from your machine

### Steps

1. Clone the repository and install:

```bash
npm install
```

2. Create `.env.local` (never commit secrets):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

3. Apply SQL scripts (see §3).

4. Start the app:

```bash
npm run dev
```

- Script: `next dev -p 3001` (`package.json`)
- App URL: **http://localhost:3001**
- Note: the stock Next README mentioned port 3000; this project’s `dev` script uses **3001**.

5. Optional checks:

```bash
npm run lint
npm run build
npm run start   # after build; Next default listen port is 3000 unless you set PORT
```

---

## 2. Local versus production configuration

| Topic | Local (documented in repo) | Production |
|-------|----------------------------|------------|
| Env file | `.env.local` with `DATABASE_URL` | Host dashboard env vars (not in repo) |
| Dev server | `npm run dev` on port **3001** | `npm run build` + `npm run start` or a host’s build pipeline |
| Database | Any Postgres matching your URL | Separate production database (unverified here) |
| Auth | None | None in code; if you add a reverse proxy/auth, that is outside this repo |
| Cron / SMS | None | None in code |

**This repository does not contain** `vercel.json`, Docker Compose, Terraform, or Neon-specific config.

---

## 3. Database migration workflow

### Mechanism

- **Manual SQL files** at the repo root.
- **No** automated migrate command in `package.json`.
- Prefer additive scripts (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

### Recommended apply order (local PostgreSQL)

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

Use your SQL client equivalently if `psql` is unavailable.

### Neon / hosted Postgres

- Point `DATABASE_URL` at the hosted instance.
- Run the **same** SQL files against that database using the provider’s SQL editor or `psql`.
- SSL requirements depend on the host; the app’s `db.ts` does not set `ssl` explicitly — configure via connection string or extend the Pool config if your provider requires it (**not verified** against a live Neon project from this documentation pass).

### Optional column: `account_type`

- Script: `account-types-init.sql`
- App remains runnable without it (defaults/compat in `schema-compat.ts` and actions).
- After applying, restart the Node process so schema capability caches can refresh.

### Code deploy vs schema vs data

| Change type | What it updates | What it does **not** do |
|-------------|-----------------|-------------------------|
| **Code deployment** | App bundle / UI / server actions | Does not alter tables by itself |
| **Schema migration** | Tables/columns/indexes via SQL | Does not move historical business data between environments |
| **Data transfer** | Rows (dump/restore, ETL) | Separate from `git` deploy; not automated in this repo |

Always apply required schema to the target database **before** or **with** a release that depends on new columns—except where runtime compat already soft-fails (loan reporting).

---

## 4. Deployment workflow (Vercel and others)

### What the repo contains

- Next.js app suitable for Node hosting.
- Default create-next-app README mentioned Vercel; **there is no project-specific Vercel configuration file** in this repo.

### Suggested (generic) Vercel flow — **not verified against a live project**

1. Connect the Git repository to Vercel (or deploy via CLI).
2. Set environment variable `DATABASE_URL` in the Vercel project settings.
3. Ensure the production database has schema applied (manual SQL).
4. Use Vercel’s default Next.js build (`next build`).
5. Confirm the deployment URL loads `/dashboard`.

**Not claimed here:** that a Vercel project exists, that env vars are set, that Neon is wired, or that any cron is registered.

### Difference from “it works locally”

Local success with `.env.local` does not prove production env, SSL, or schema state.

---

## 5. Cron, SMS, and reminder endpoints

| Item | Status |
|------|--------|
| Reminder HTTP route | **Not implemented** |
| Cron schedule in repo | **Not implemented** |
| SMS send / provider | **Not implemented** |
| Duplicate-send protection for SMS | **N/A** (no SMS) |
| Retry behavior for SMS | **N/A** |

Bill “reminders” are **in-app UI** based on unpaid/due `scheduled_bills` queries. They do **not** send messages.

If you later add a reminder endpoint:

- Manually calling it may send **real** messages once a provider is wired.
- A working manual call does **not** prove a scheduler is registered on the host.

---

## 6. Logs and troubleshooting

### Local

- Terminal running `npm run dev` shows Next.js and server `console.error` / `console.info` output.
- Database/schema diagnostics often use prefixes:
  - `[db-error]` / `[db-error:raw]` via `logDbError` in `actions.ts`
  - `[schema-compat]` for missing `account_type` or skipped debt reporting

### Production

- Use your host’s log viewer (e.g. Vercel Functions logs). **Not verified** for a specific account.
- Correlate failures with `DATABASE_URL` connectivity and whether tables exist.

### Common failures

| Symptom | Check |
|---------|--------|
| Connection errors | `DATABASE_URL`, network, Postgres running |
| `column "account_type" does not exist` (older code paths) | Apply `account-types-init.sql` or ensure you run a build that includes schema-compat guards |
| Empty debt reporting | Expected without liability schema/data |
| Cannot delete account | FK references from transactions/bills |

---

## 7. Backup and recovery

### Existing automation in this repo

**None.** No backup scripts, snapshots, or scheduled dumps are defined.

### Recommended procedures (operator responsibility)

- Enable automated backups on your Postgres host (local dumps, managed provider backups, or Neon point-in-time recovery if you use Neon).
- Periodically test restore to a non-production database.
- Keep SQL init scripts in git as schema source of truth; keep **data** backups separate.
- Document who owns restore drills (not defined in code).

---

## 8. Security notes for operators

- The app has **no built-in authentication**. Do not expose a production instance publicly without network controls or an auth layer you add yourself.
- Rotate database passwords if leaked; never paste real `DATABASE_URL` values into tickets or docs.
- `.env.local` should remain gitignored.
