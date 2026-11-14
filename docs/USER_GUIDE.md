# User Guide — My Finances (Accountz)

Guide for everyday use of the personal finance app. Steps use labels that appear in the UI where verified in the codebase.

> **Note:** This product tracks money (accounts, transactions, budgets, bills, reports). It does **not** manage salon clients, appointments, staff, or SMS. If you expected a booking system, see [VERIFICATION_NEEDED.md](VERIFICATION_NEEDED.md).

**Needs manual UI verification:** Exact screen layout on every screen size; some Spanish placeholder text on the dashboard (for example “Buscar…”) may appear depending on which header component is shown.

---

## 1. Getting around

After the app opens, you land on the **Dashboard** (`/` redirects there).

The left sidebar (**My Finances**) includes:

| Menu label | Goes to | Status |
|------------|---------|--------|
| Dashboard | `/dashboard` | Implemented |
| Transactions | `/transactions` | Implemented |
| Accounts | `/accounts` | Implemented |
| Categories | `/categories` | Implemented |
| Budgets | `/budgets` | Implemented |
| Reports | `/reports` | Implemented |
| Goals | `#` (no page) | **Stub only** — not a working feature |

---

## 2. Accounts

### Create an account

1. Open **Accounts**.
2. Click **New Account**.
3. Fill in:
   - **Name** (example placeholder: `Checking, Savings, Cash`)
   - **Currency** (default often `EUR`)
   - **Opening Balance**
   - **Alert Limit**
   - **Notes** (optional)
   - **Account Type** (only if your database supports it): **Asset (bank, cash, savings)** or **Loan / Liability**
4. Click **Save Account**.

Success toast: `Account created!`  
Failure toast: `Failed to create account.`

### Loan / Liability accounts (when available)

For a loan:

1. Set **Account Type** to **Loan / Liability**.
2. Use a **negative** opening balance for the amount owed (for example `-20000`).
3. Record **principal** as a **transfer** from a bank account **to** the loan account (this reduces the loan balance toward zero).
4. Record **interest** as a normal **expense** (it appears in expense reports; principal does not).

If **Account Type** is not shown, your database may not have the optional `account_type` column yet. The app still works; all accounts behave like assets for reporting.

### Edit or delete an account

1. Select an account in the list.
2. Use **Edit** / pencil or **Delete** / trash (confirm delete when prompted).

Success: `Account updated!` / `Account deleted!`  
Delete may fail if the account is still referenced by transactions (server blocks that).

### Account detail tabs

On an account you can switch among:

- **Transactions**
- **Statements** — shows that statements are not available yet
- **Account Details**

---

## 3. Transactions

### Add a transaction

1. Open **Transactions**.
2. Start a new transaction (new-transaction UI / modal in the app).
3. Choose type: **income**, **expense**, or **transfer**.
4. Fill required fields, then save.

### Validation messages (from the form)

Verified in `transaction-ios-form.tsx`:

| Message | When |
|---------|------|
| `Please select both accounts.` | Transfer missing From/To |
| `From and To accounts must be different.` | Same account on both sides |
| `Please enter a valid amount.` | Invalid amount |
| `Please select an account.` | Missing account |
| `Please select a category.` | Missing category (income/expense) |
| `Please enter details.` | Missing description |

Details field placeholder: `e.g. Netflix` (or `Transfer` for transfers). Amount placeholder: `0.00`.

### Search

On the transactions list, use **Search transactions...** to filter the list (client-side search in the list component).

### Edit and delete

- Income and expense can be updated/deleted from row actions.
- Success: `Transaction updated!` / `Transaction deleted!`
- **Editing transfers is not supported yet** (server throws that message). Delete may still be available via delete action.

### Transfers vs expenses

- A **transfer** moves money between accounts and is **not** counted as income or expense in P&L-style totals.
- Paying down a **Loan / Liability** account with a transfer is the intended principal payment path.

---

## 4. Categories

1. Open **Categories**.
2. Create with **category name**, optional **group** (placeholder example: `Utilities (optional)`), **type** (income/expense), and **color** (hex, e.g. `#6366f1`).
3. Edit or delete with row actions.

Validation (from `category-ios-form.tsx`):

- `Please enter a category name.`
- `Please enter a valid hex color.`

Duplicate names are rejected by the server (`A category with this name already exists.`).

There is a system-style **Transfer** category used for transfer transactions (seeded by SQL).

---

## 5. Budgets and scheduled bills

### Category budgets

1. Open **Budgets**.
2. Create a budget linked to a category and amount.
3. Edit/delete via budget actions.

Toasts: `Budget created!`, `Budget updated!`, `Budget deleted!` (and matching failure messages).

### Scheduled bills calendar

The Budgets page includes a **custom month calendar** (not FullCalendar). It is a Monday-start grid built in `budget-calendar.tsx`.

Typical workflow:

1. Navigate months with previous/next controls (title style like `Jan' 2026`).
2. Add a scheduled bill (**Scheduled bill** create flow).
3. Fields include title (placeholder `Netflix`), amount, due date, category, optional account.
4. Open a bill on a day to view details, edit, delete, or mark paid.

Validation (scheduled bill form):

- `Please enter a title.`
- `Please enter a valid amount.`
- `Please select a due date.`
- When paying: `Please select an account.`

Paying a bill (`payScheduledBill`) creates an expense transaction against the selected account and marks the bill paid. Success toast example: `{title} marked as paid.`

**Needs manual UI verification:** Exact button labels for “Add bill” / month navigation on your build; agenda sidebar behavior on small screens.

---

## 6. Reports

Open **Reports**. Views (toggle):

- **Monthly Overview**
- **Monthly by Group**
- **Monthly by Category**

### Monthly Overview (verified behavior)

- **Total Income**, **Total Expenses**, **Net Balance** — from income/expense transactions only (transfers excluded).
- **Expenses by Category** — pie chart.
- **Cash Flow** — weekly income vs expenses (and loan principal bars when debt reporting is available).
- **Loan Principal Paid** — shown only when the database supports liability account types; lists transfers into loan accounts. Labeled as not counted as expenses.

### Yearly views

Expense matrix by category group or category name. A **Loan Principal Paid** table may appear below when debt reporting is supported.

Period navigation: previous/next month or year depending on view.

---

## 7. Dashboard

Shows overview charts and summaries loaded from server actions (cash flow, spending by group, targets, unpaid bills). Some filter UI text may be in Spanish (for example **Este año**); treat that as presentational unless changed.

The top search field (e.g. **Search transactions, budgets, reports...** or **Buscar...**) is **not** confirmed as a full global search backend — treat as UI chrome unless you verify behavior in the browser.

Bill reminders on the dashboard are **in-app banners** for unpaid/due bills, not SMS.

---

## 8. Common issues

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Pages fail to load / DB errors | Missing or wrong `DATABASE_URL`, or schema not applied | Check env and run SQL init scripts ([OPERATIONS.md](OPERATIONS.md)) |
| No **Account Type** field | Optional `account_type` column missing | App still works; apply `account-types-init.sql` to enable loans |
| Loan payments missing from Reports | Account not set to **Loan / Liability**, or schema unavailable | Set type after migration; principal must be a **transfer** to the loan |
| Cannot edit a transfer | By design today | Delete and recreate, or wait for edit support |
| Goals does nothing | Stub link | Ignore until implemented |
| Cannot delete account | Transactions still reference it | Move/delete related transactions first |

---

## 9. What this guide does not cover

- User login / multi-user permissions (not implemented)
- SMS, email, or push reminders
- Bank sync / import
- Mobile native apps
- Production hosting settings (see [OPERATIONS.md](OPERATIONS.md) and [VERIFICATION_NEEDED.md](VERIFICATION_NEEDED.md))
