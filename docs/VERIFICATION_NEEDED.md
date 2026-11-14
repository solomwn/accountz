# Verification Needed

Items that **cannot** be confirmed from the repository alone, plus discrepancies with assumptions that may appear in templates or older notes.

---

## 1. Product identity discrepancy

A documentation request template referred to salon workflows (clients, appointments, staff, SMS reminders, FullCalendar, Vercel cron, Neon).

**Verified from this codebase:** Accountz is a **personal finance / accounting** Next.js app (“My Finances”), not a salon booking system.

Anything about clients, appointments, SMS providers, or appointment calendars is **out of scope for current implementation** unless separately built later.

---

## 2. Production environment

| Item | Repo evidence | Unverified |
|------|---------------|------------|
| Hosting provider | None committed | Whether the app is deployed anywhere |
| Vercel project settings | No `vercel.json`; no Vercel project IDs | Build settings, domains, env in dashboard |
| Production `DATABASE_URL` | Only local `.env.local` pattern | Live connection string / SSL mode |
| Neon project / branch | Not referenced in code | Whether Neon is used in production |
| Live schema state | SQL files are source of intended schema | Whether production has every script applied |
| Node / Next runtime version on host | `package.json` declares versions | What the host actually runs |

---

## 3. Schedulers and messaging

| Item | Status |
|------|--------|
| Cron registration | Not in repo — **cannot** claim a schedule or timezone |
| Reminder endpoint | Does not exist |
| SMS credentials / provider | Do not exist |
| Duplicate-send / retry for SMS | N/A |
| Manual vs automatic reminder sending | N/A |

In-app bill banners are **not** proof of outbound messaging.

---

## 4. Authentication and multi-tenancy

- No login, roles, or org isolation in code.
- Production access control (VPN, SSO, Basic Auth at edge) — **unknown**.
- Mock user display data may appear on the dashboard — not a real identity system.

---

## 5. Backups

- No backup automation in repo.
- Provider-side backups (Neon PITR, managed Postgres snapshots) — **unknown** unless checked in the provider console.

---

## 6. UI / UX needing manual browser verification

Confirm in a running app:

- Exact visible labels for budget calendar add/edit/pay buttons across breakpoints.
- Whether header search fields perform real filtering or are decorative.
- Mixed English/Spanish copy on dashboard filters (`Este año`, `Buscar…`) vs English elsewhere.
- Goals sidebar item (links to `#`) — confirm it remains a stub.
- Transfer edit UX when the server rejects edits.
- Loan Principal Paid sections after applying `account-types-init.sql` and setting a liability account.

---

## 7. Schema compatibility cache

`supportsAccountType()` caches column existence in process memory (`schema-compat.ts`). After applying `account-types-init.sql` to a long-running server, a **process restart** may be required before the app detects the new column. Exact production process recycling behavior depends on the host.

---

## 8. Credentials and secrets

- Do not document real passwords, tokens, or phone numbers.
- A `.env.local` may exist on developer machines; its contents must stay private.
- This documentation pass did **not** change application code, production state, or deploy configuration beyond writing markdown under `README.md` and `docs/`.

---

## 9. Checklist for operators closing gaps

1. Confirm which environment hosts the app (if any).
2. Confirm production DB has all SQL scripts applied.
3. Confirm `DATABASE_URL` is set only in secure env storage.
4. Decide whether public access needs auth (currently none in app).
5. Enable and test database backups.
6. If loan reporting is required, apply `account-types-init.sql`, restart app, mark accounts as **Loan / Liability**.
7. Do not assume SMS/cron exists until code and host registration are added and verified separately.
