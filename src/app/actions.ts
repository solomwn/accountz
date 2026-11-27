"use server";

import { revalidatePath } from "next/cache";
import { pool } from "../../db";
import { getLocalDateString, normalizeDateInput, toDateOnlyString } from "@/lib/format";
import {
  hasColumn,
  normalizeAccountType,
  supportsAccountType,
  type AccountType,
} from "@/lib/schema-compat";

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  category: string;
  categoryId: string;
  date: string;
  accountId: string;
  toAccountId: string | null;
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  groupName: string | null;
}

export interface CategoryInput {
  name: string;
  type: "income" | "expense";
  color: string;
  groupName?: string | null;
}

const CATEGORY_DUPLICATE_NAME_ERROR =
  "A category with this name already exists.";

function normalizeCategoryName(name: string): string {
  return name.trim();
}

function isCategoryNameUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const pgError = error as { code?: string; constraint?: string };
  return (
    pgError.code === "23505" && pgError.constraint === "categories_name_key"
  );
}

async function categoryNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const result = excludeId
    ? await pool.query(
        `SELECT 1 FROM categories WHERE name = $1 AND id <> $2 LIMIT 1`,
        [name, excludeId]
      )
    : await pool.query(`SELECT 1 FROM categories WHERE name = $1 LIMIT 1`, [
        name,
      ]);

  return (result.rowCount ?? 0) > 0;
}

export type { AccountType } from "@/lib/schema-compat";

export interface Account {
  id: string;
  name: string;
  currency: string;
  openingBalance: string;
  alertLimit: string;
  notes: string | null;
  accountType: AccountType;
  /** Present only when the loan-details columns exist (loan-details-init.sql). */
  loan?: LoanDetails;
}

export interface LoanDetails {
  lender: string | null;
  /** Annual interest rate in percent, e.g. "6.6124301". */
  interestRate: string | null;
  initialAmount: string | null;
  installmentAmount: string | null;
  /** YYYY-MM-DD */
  nextPaymentDate: string | null;
  /** YYYY-MM-DD */
  endDate: string | null;
}

export interface AccountInput {
  name: string;
  currency: string;
  openingBalance: number;
  alertLimit: number;
  notes?: string;
  accountType?: AccountType;
  loan?: LoanDetails;
}

export interface AccountBalance extends Account {
  currentBalance: number;
  /** Transfers received by this account (loan principal payments for loans). */
  transfersInTotal: number;
  transfersInCount: number;
  /** YYYY-MM-DD of the latest transfer received, if any. */
  lastTransferInDate: string | null;
}

const LOAN_SELECT_COLUMNS = `
  a.lender,
  a.interest_rate,
  a.loan_initial_amount,
  a.installment_amount,
  to_char(a.next_payment_date, 'YYYY-MM-DD') AS next_payment_date,
  to_char(a.loan_end_date, 'YYYY-MM-DD') AS loan_end_date`;

function rowToLoanDetails(row: Record<string, unknown>): LoanDetails {
  const str = (value: unknown) =>
    value === null || value === undefined || value === "" ? null : String(value);
  return {
    lender: str(row.lender),
    interestRate: str(row.interest_rate),
    initialAmount: str(row.loan_initial_amount),
    installmentAmount: str(row.installment_amount),
    nextPaymentDate: str(row.next_payment_date),
    endDate: str(row.loan_end_date),
  };
}

async function supportsLoanDetails(): Promise<boolean> {
  return hasColumn("accounts", "loan_end_date");
}

async function saveLoanDetails(id: string, loan: LoanDetails | undefined) {
  if (!loan || !(await supportsLoanDetails())) return;
  const orNull = (value: string | null) =>
    value === null || value.trim() === "" ? null : value.trim();
  await pool.query(
    `UPDATE accounts
     SET lender = $1, interest_rate = $2, loan_initial_amount = $3,
         installment_amount = $4, next_payment_date = $5::date, loan_end_date = $6::date
     WHERE id = $7`,
    [
      orNull(loan.lender),
      orNull(loan.interestRate),
      orNull(loan.initialAmount),
      orNull(loan.installmentAmount),
      orNull(loan.nextPaymentDate),
      orNull(loan.endDate),
      id,
    ]
  );
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  taxesAccountBalance: number;
}

export interface MonthlyComparison {
  currentMonthIncome: number;
  lastMonthIncome: number;
  currentMonthExpense: number;
  lastMonthExpense: number;
  currentMonthTransactionCount: number;
  lastMonthTransactionCount: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface IncomeCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyCashFlow {
  month: string;
  income: number;
  expense: number;
}

export interface CashFlowMonth {
  name: string;
  income: number;
  expense: number;
}

export interface CashFlowChartPoint {
  month: string;
  inflow: number;
  outflow: number;
  debtPayments: number;
}

export interface SpendingByGroup {
  name: string;
  value: number;
  target: number;
  color: string;
}

export interface GroupTransaction {
  id: string;
  description: string;
  amount: string;
  date: string;
  category: string;
}

export interface MonthlyTargetData {
  spent: number;
  target: number;
}

export interface BudgetSummary {
  totalPlanned: number;
  totalPaid: number;
  remaining: number;
}

export interface ReportExpenseCategory {
  categoryName: string;
  amount: number;
  color: string;
}

export interface ReportDebtPaymentAccount {
  accountName: string;
  amount: number;
}

export interface ReportCashFlowPoint {
  label: string;
  income: number;
  expense: number;
  debtPayments: number;
}

export interface ReportData {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalDebtPayments: number;
  debtPaymentsByAccount: ReportDebtPaymentAccount[];
  expensesByCategory: ReportExpenseCategory[];
  cashFlow: ReportCashFlowPoint[];
  supportsDebtPaymentReporting: boolean;
}

export interface YearlyMatrixDetailRow {
  description: string;
  months: { [monthIndex: number]: number };
  rowTotal: number;
  lastTransactionDate: string | null;
}

export interface YearlyMatrixRow {
  categoryId: string;
  categoryName: string;
  color: string;
  months: { [monthIndex: number]: number };
  rowTotal: number;
  details: YearlyMatrixDetailRow[];
  lastTransactionDate: string | null;
}

export interface YearlyMatrixGroup {
  groupName: string;
  rows: YearlyMatrixRow[];
  monthlyTotals: { [monthIndex: number]: number };
  rowTotal: number;
}

export interface YearlyMatrixSection {
  groups: YearlyMatrixGroup[];
  monthlyTotals: { [monthIndex: number]: number };
  grandTotal: number;
}

export interface YearlyMatrixData {
  year: number;
  income: YearlyMatrixSection;
  expenses: YearlyMatrixSection;
  debtPayments: {
    rows: YearlyMatrixDetailRow[];
    monthlyTotals: { [monthIndex: number]: number };
    grandTotal: number;
  };
  supportsDebtPaymentReporting: boolean;
  net: {
    monthlyTotals: { [monthIndex: number]: number };
    grandTotal: number;
  };
}

export interface Budget {
  id: string;
  category: string;
  categoryId: string;
  amount: string;
  type: "income" | "expense";
}

export interface BudgetInput {
  categoryId: string;
  amount: number;
  type: "income" | "expense";
}

export interface ScheduledBill {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string | null;
  accountName: string | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledBillInput {
  title: string;
  amount: number;
  dueDate: string;
  categoryId?: string | null;
  accountId?: string | null;
}

export interface GlobalTargets {
  totalIncomeTarget: number;
  totalExpenseTarget: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Transactions whose date falls in the server's current calendar month. */
const CURRENT_MONTH_DATE_SQL = `date >= date_trunc('month', CURRENT_DATE)::date
           AND date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date`;

function formatDate(date: Date | string): string {
  return toDateOnlyString(date);
}

/**
 * Logs the REAL underlying database/runtime error with all diagnostic fields.
 *
 * The browser overlay only ever shows the sanitized wrapper message
 * (e.g. "Failed to fetch yearly cash flow"). This surfaces the actual
 * pg error code/detail/hint on the server console so the true root cause
 * (missing table/column, connection failure, bad migration, etc.) is visible.
 */
function logDbError(context: string, error: unknown): void {
  const pgError = error as {
    message?: string;
    code?: string;
    detail?: string;
    hint?: string;
    schema?: string;
    table?: string;
    column?: string;
    constraint?: string;
    routine?: string;
  } | null;

  console.error(`[db-error] ${context}:`, {
    message: pgError?.message,
    code: pgError?.code,
    detail: pgError?.detail,
    hint: pgError?.hint,
    schema: pgError?.schema,
    table: pgError?.table,
    column: pgError?.column,
    constraint: pgError?.constraint,
    routine: pgError?.routine,
  });
  // Also log the raw error so the full stack trace is preserved.
  console.error(`[db-error:raw] ${context}:`, error);
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const result = await pool.query(
      `SELECT t.id, t.description, t.amount, t.type, t.date, t.account_id,
              t.to_account_id, t.category_id, COALESCE(c.name, t.category) AS category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       ORDER BY t.date DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      description: row.description,
      amount: String(row.amount),
      type: row.type,
      category: row.category,
      categoryId: row.category_id,
      date: formatDate(row.date),
      accountId: row.account_id,
      toAccountId: row.to_account_id ?? null,
    }));
  } catch (error) {
    console.error("getTransactions error:", error);
    throw new Error("Failed to fetch transactions");
  }
}

export interface RecentPayee {
  description: string;
  categoryId: string;
}

export async function getRecentPayees(): Promise<RecentPayee[]> {
  try {
    const result = await pool.query(
      `WITH combined AS (
         SELECT
           TRIM(description) AS description,
           category_id,
           date AS sort_date,
           id::text AS tie_breaker
         FROM transactions
         WHERE description IS NOT NULL
           AND TRIM(description) != ''
           AND category_id IS NOT NULL
           AND type IN ('income', 'expense')
         UNION ALL
         SELECT
           TRIM(title) AS description,
           category_id,
           due_date AS sort_date,
           id::text AS tie_breaker
         FROM scheduled_bills
         WHERE title IS NOT NULL
           AND TRIM(title) != ''
           AND category_id IS NOT NULL
       ),
       latest_payees AS (
         SELECT DISTINCT ON (LOWER(description))
           description,
           category_id,
           sort_date
         FROM combined
         ORDER BY LOWER(description), sort_date DESC, tie_breaker DESC
       )
       SELECT description, category_id
       FROM latest_payees
       ORDER BY sort_date DESC
       LIMIT 50`
    );

    return result.rows.map((row) => ({
      description: row.description as string,
      categoryId: row.category_id as string,
    }));
  } catch (error) {
    console.error("getRecentPayees error:", error);
    throw new Error("Failed to fetch recent payees");
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const result = await pool.query(
      `SELECT id, name, type, color, group_name
       FROM categories
       ORDER BY type, name`
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color,
      groupName: row.group_name ?? null,
    }));
  } catch (error) {
    console.error("getCategories error:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function createCategory(data: CategoryInput): Promise<void> {
  const name = normalizeCategoryName(data.name);
  if (!name) {
    throw new Error("Please enter a category name.");
  }

  if (await categoryNameExists(name)) {
    throw new Error(CATEGORY_DUPLICATE_NAME_ERROR);
  }

  try {
    await pool.query(
      `INSERT INTO categories (name, type, color, group_name)
       VALUES ($1, $2, $3, $4)`,
      [
        name,
        data.type,
        data.color,
        data.groupName?.trim() ? data.groupName.trim() : null,
      ]
    );
    revalidateCategoryPages();
  } catch (error) {
    if (isCategoryNameUniqueViolation(error)) {
      throw new Error(CATEGORY_DUPLICATE_NAME_ERROR);
    }
    console.error("createCategory error:", error);
    throw new Error("Failed to create category");
  }
}

export async function updateCategory(
  id: string,
  data: CategoryInput
): Promise<void> {
  const name = normalizeCategoryName(data.name);
  if (!name) {
    throw new Error("Please enter a category name.");
  }

  if (await categoryNameExists(name, id)) {
    throw new Error(CATEGORY_DUPLICATE_NAME_ERROR);
  }

  try {
    await pool.query(
      `UPDATE categories
       SET name = $1, type = $2, color = $3, group_name = $4
       WHERE id = $5`,
      [
        name,
        data.type,
        data.color,
        data.groupName?.trim() ? data.groupName.trim() : null,
        id,
      ]
    );
    revalidateCategoryPages();
  } catch (error) {
    if (isCategoryNameUniqueViolation(error)) {
      throw new Error(CATEGORY_DUPLICATE_NAME_ERROR);
    }
    console.error("updateCategory error:", error);
    throw new Error("Failed to update category");
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const usage = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM transactions WHERE category_id = $1) AS tx_count,
         (SELECT COUNT(*)::int FROM budgets WHERE category_id = $1) AS budget_count`,
      [id]
    );

    const { tx_count, budget_count } = usage.rows[0];
    if (tx_count > 0 || budget_count > 0) {
      throw new Error("Cannot delete a category that is in use");
    }

    await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);
    revalidateCategoryPages();
  } catch (error) {
    console.error("deleteCategory error:", error);
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      throw error;
    }
    throw new Error("Failed to delete category");
  }
}

export async function getSchemaCapabilities(): Promise<{
  accountType: boolean;
}> {
  return {
    accountType: await supportsAccountType(),
  };
}

export async function getAccounts(): Promise<Account[]> {
  try {
    const includeAccountType = await supportsAccountType();
    const includeLoan = await supportsLoanDetails();
    const accountTypeColumn = includeAccountType ? ", a.account_type" : "";
    const loanColumns = includeLoan ? `,${LOAN_SELECT_COLUMNS}` : "";
    const result = await pool.query(
      `SELECT a.id, a.name, a.currency, a.opening_balance, a.alert_limit, a.notes${accountTypeColumn}${loanColumns}
       FROM accounts a
       ORDER BY a.name`
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      openingBalance: String(row.opening_balance),
      alertLimit: String(row.alert_limit),
      notes: row.notes,
      accountType: includeAccountType
        ? normalizeAccountType(row.account_type)
        : "asset",
      ...(includeLoan ? { loan: rowToLoanDetails(row) } : {}),
    }));
  } catch (error) {
    console.error("getAccounts error:", error);
    throw new Error("Failed to fetch accounts");
  }
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  try {
    const includeAccountType = await supportsAccountType();
    const includeLoan = await supportsLoanDetails();
    const accountTypeColumn = includeAccountType ? "a.account_type," : "";
    const loanColumns = includeLoan ? `${LOAN_SELECT_COLUMNS},` : "";
    const result = await pool.query(
      `SELECT
         a.id,
         a.name,
         a.currency,
         a.opening_balance,
         a.alert_limit,
         a.notes,
         ${accountTypeColumn}
         ${loanColumns}
         COALESCE((
           SELECT SUM(t.amount) FROM transactions t
           WHERE t.to_account_id = a.id AND t.type = 'transfer'
         ), 0) AS transfers_in_total,
         (
           SELECT COUNT(*)::int FROM transactions t
           WHERE t.to_account_id = a.id AND t.type = 'transfer'
         ) AS transfers_in_count,
         (
           SELECT to_char(MAX(t.date), 'YYYY-MM-DD') FROM transactions t
           WHERE t.to_account_id = a.id AND t.type = 'transfer'
         ) AS last_transfer_in_date,
         COALESCE(a.opening_balance, 0)
           + COALESCE((
               SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.account_id = a.id AND t.type = 'income'
             ), 0)
           - COALESCE((
               SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.account_id = a.id AND t.type = 'expense'
             ), 0)
           - COALESCE((
               SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.account_id = a.id AND t.type = 'transfer'
             ), 0)
           + COALESCE((
               SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.to_account_id = a.id AND t.type = 'transfer'
             ), 0)
           AS current_balance
       FROM accounts a
       ORDER BY a.name`
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      openingBalance: String(row.opening_balance),
      alertLimit: String(row.alert_limit),
      notes: row.notes,
      accountType: includeAccountType
        ? normalizeAccountType(row.account_type)
        : "asset",
      ...(includeLoan ? { loan: rowToLoanDetails(row) } : {}),
      currentBalance: parseFloat(row.current_balance),
      transfersInTotal: parseFloat(row.transfers_in_total),
      transfersInCount: Number(row.transfers_in_count),
      lastTransferInDate: row.last_transfer_in_date ?? null,
    }));
  } catch (error) {
    console.error("getAccountBalances error:", error);
    throw new Error("Failed to fetch account balances");
  }
}

export async function createAccount(data: AccountInput): Promise<void> {
  try {
    const includeAccountType = await supportsAccountType();
    if (includeAccountType) {
      await pool.query(
        `INSERT INTO accounts (name, currency, opening_balance, alert_limit, notes, account_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.name,
          data.currency,
          data.openingBalance,
          data.alertLimit,
          data.notes ?? null,
          normalizeAccountType(data.accountType),
        ]
      );
    } else {
      if (data.accountType && data.accountType !== "asset") {
        console.info(
          "[schema-compat] Skipping account_type on create; column unavailable."
        );
      }
      await pool.query(
        `INSERT INTO accounts (name, currency, opening_balance, alert_limit, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          data.name,
          data.currency,
          data.openingBalance,
          data.alertLimit,
          data.notes ?? null,
        ]
      );
    }
    revalidateAccountPages();
  } catch (error) {
    console.error("createAccount error:", error);
    throw new Error("Failed to create account");
  }
}

export async function updateAccount(id: string, data: AccountInput): Promise<void> {
  try {
    const includeAccountType = await supportsAccountType();
    if (includeAccountType) {
      await pool.query(
        `UPDATE accounts
         SET name = $1, currency = $2, opening_balance = $3, alert_limit = $4, notes = $5, account_type = $6
         WHERE id = $7`,
        [
          data.name,
          data.currency,
          data.openingBalance,
          data.alertLimit,
          data.notes ?? null,
          normalizeAccountType(data.accountType),
          id,
        ]
      );
    } else {
      if (data.accountType && data.accountType !== "asset") {
        console.info(
          "[schema-compat] Skipping account_type on update; column unavailable."
        );
      }
      await pool.query(
        `UPDATE accounts
         SET name = $1, currency = $2, opening_balance = $3, alert_limit = $4, notes = $5
         WHERE id = $6`,
        [
          data.name,
          data.currency,
          data.openingBalance,
          data.alertLimit,
          data.notes ?? null,
          id,
        ]
      );
    }
    await saveLoanDetails(id, data.loan);
    revalidateAccountPages();
  } catch (error) {
    console.error("updateAccount error:", error);
    throw new Error("Failed to update account");
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    const txCount = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM transactions
       WHERE account_id = $1 OR to_account_id = $1`,
      [id]
    );

    if (txCount.rows[0].count > 0) {
      throw new Error("Cannot delete an account that has transactions");
    }

    await pool.query(`DELETE FROM accounts WHERE id = $1`, [id]);
    revalidateAccountPages();
  } catch (error) {
    console.error("deleteAccount error:", error);
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      throw error;
    }
    throw new Error("Failed to delete account");
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions`
    );

    const row = result.rows[0];
    const totalIncome = parseFloat(row.total_income);
    const totalExpense = parseFloat(row.total_expense);

    const taxesResult = await pool.query(
      `SELECT COALESCE(SUM(t.amount), 0) AS taxes_total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense'
         AND LOWER(c.name) LIKE '%tax%'`
    );
    const taxesTotal = parseFloat(taxesResult.rows[0].taxes_total);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      taxesAccountBalance: taxesTotal,
    };
  } catch (error) {
    console.error("getDashboardSummary error:", error);
    throw new Error("Failed to fetch dashboard summary");
  }
}

export async function getMonthlyComparison(): Promise<MonthlyComparison> {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(
           CASE
             WHEN type = 'income'
               AND ${CURRENT_MONTH_DATE_SQL}
             THEN amount
             ELSE 0
           END
         ), 0) AS current_month_income,
         COALESCE(SUM(
           CASE
             WHEN type = 'expense'
               AND ${CURRENT_MONTH_DATE_SQL}
             THEN amount
             ELSE 0
           END
         ), 0) AS current_month_expense,
         COALESCE(SUM(
           CASE
             WHEN type = 'income'
               AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
               AND date < date_trunc('month', CURRENT_DATE)
             THEN amount
             ELSE 0
           END
         ), 0) AS last_month_income,
         COALESCE(SUM(
           CASE
             WHEN type = 'expense'
               AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
               AND date < date_trunc('month', CURRENT_DATE)
             THEN amount
             ELSE 0
           END
         ), 0) AS last_month_expense,
         COUNT(*) FILTER (
           WHERE type IN ('income', 'expense')
             AND ${CURRENT_MONTH_DATE_SQL}
         ) AS current_month_transaction_count,
         COUNT(*) FILTER (
           WHERE type IN ('income', 'expense')
             AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
             AND date < date_trunc('month', CURRENT_DATE)
         ) AS last_month_transaction_count
       FROM transactions
       WHERE type IN ('income', 'expense')`
    );

    const row = result.rows[0];

    return {
      currentMonthIncome: parseFloat(row.current_month_income),
      lastMonthIncome: parseFloat(row.last_month_income),
      currentMonthExpense: parseFloat(row.current_month_expense),
      lastMonthExpense: parseFloat(row.last_month_expense),
      currentMonthTransactionCount: Number(row.current_month_transaction_count),
      lastMonthTransactionCount: Number(row.last_month_transaction_count),
    };
  } catch (error) {
    console.error("getMonthlyComparison error:", error);
    throw new Error("Failed to fetch monthly comparison");
  }
}

export async function getExpensesByCategory(): Promise<ExpenseCategory[]> {
  try {
    const result = await pool.query(
      `SELECT c.name AS category, c.color AS color, COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense'
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`
    );

    const totalExpense = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.total),
      0
    );

    if (totalExpense === 0) {
      return [];
    }

    return result.rows.map((row) => {
      const amount = parseFloat(row.total);
      return {
        category: row.category,
        color: row.color,
        amount,
        percentage: Math.round((amount / totalExpense) * 100),
      };
    });
  } catch (error) {
    console.error("getExpensesByCategory error:", error);
    throw new Error("Failed to fetch expense categories");
  }
}

export async function getIncomeByCategory(): Promise<IncomeCategory[]> {
  try {
    const result = await pool.query(
      `SELECT c.name AS category, c.color AS color, COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'income'
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`
    );

    const totalIncome = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.total),
      0
    );

    if (totalIncome === 0) {
      return [];
    }

    return result.rows.map((row) => {
      const amount = parseFloat(row.total);
      return {
        category: row.category,
        color: row.color,
        amount,
        percentage: Math.round((amount / totalIncome) * 100),
      };
    });
  } catch (error) {
    console.error("getIncomeByCategory error:", error);
    throw new Error("Failed to fetch income categories");
  }
}

export async function getMonthlyCashFlow(): Promise<MonthlyCashFlow[]> {
  try {
    const result = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM date)::int AS month_num,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY month_num`
    );

    const byMonth = new Map(
      result.rows.map((row) => [
        Number(row.month_num),
        {
          income: parseFloat(row.income),
          expense: parseFloat(row.expense),
        },
      ])
    );

    return MONTH_LABELS.map((month, index) => {
      const data = byMonth.get(index + 1);
      return {
        month,
        income: data?.income ?? 0,
        expense: data?.expense ?? 0,
      };
    });
  } catch (error) {
    console.error("getMonthlyCashFlow error:", error);
    throw new Error("Failed to fetch monthly cash flow");
  }
}

export async function getLastSixMonthsCashFlow(): Promise<CashFlowMonth[]> {
  try {
    const result = await pool.query(
      `SELECT
         EXTRACT(YEAR FROM date)::int AS year_num,
         EXTRACT(MONTH FROM date)::int AS month_num,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
         AND type IN ('income', 'expense')
       GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
       ORDER BY year_num, month_num`
    );

    const byKey = new Map(
      result.rows.map((row) => [
        `${row.year_num}-${row.month_num}`,
        {
          income: parseFloat(row.income),
          expense: parseFloat(row.expense),
        },
      ])
    );

    const months: CashFlowMonth[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const data = byKey.get(`${year}-${month}`);

      months.push({
        name: MONTH_LABELS[month - 1]!,
        income: data?.income ?? 0,
        expense: data?.expense ?? 0,
      });
    }

    return months;
  } catch (error) {
    console.error("getLastSixMonthsCashFlow error:", error);
    throw new Error("Failed to fetch last six months cash flow");
  }
}

/**
 * Explicit schema capability check for optional loan/liability reporting.
 * Never throws — unavailable schema (or a failed check) returns false.
 */
async function isDebtPaymentReportingAvailable(): Promise<boolean> {
  try {
    return await supportsAccountType();
  } catch (error) {
    console.info(
      "[schema-compat] Could not determine account_type support; skipping debt-payment reporting.",
      error
    );
    return false;
  }
}

function emptyMonthlyDebtPaymentReport(): {
  supportsDebtPaymentReporting: false;
  totalDebtPayments: 0;
  debtPaymentsByAccount: ReportDebtPaymentAccount[];
  debtPaymentsByWeek: Map<number, number>;
} {
  return {
    supportsDebtPaymentReporting: false,
    totalDebtPayments: 0,
    debtPaymentsByAccount: [],
    debtPaymentsByWeek: new Map(),
  };
}

function emptyYearlyDebtPaymentMatrix(): {
  supportsDebtPaymentReporting: false;
  rows: Array<{
    accountId: string;
    accountName: string;
    monthNum: number;
    amount: number;
    lastTransactionDate: Date | string | null;
  }>;
} {
  return {
    supportsDebtPaymentReporting: false,
    rows: [],
  };
}

/**
 * Optional monthly debt-payment reporting for the Reports page.
 * Isolated from income/expense queries so a missing/partial schema never
 * crashes getReportData.
 */
async function getMonthlyDebtPaymentReporting(
  month: number,
  year: number
): Promise<{
  supportsDebtPaymentReporting: boolean;
  totalDebtPayments: number;
  debtPaymentsByAccount: ReportDebtPaymentAccount[];
  debtPaymentsByWeek: Map<number, number>;
}> {
  const available = await isDebtPaymentReportingAvailable();
  if (!available) {
    return emptyMonthlyDebtPaymentReport();
  }

  try {
    const [totalResult, byAccountResult, byWeekResult] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(t.amount), 0) AS total
         FROM transactions t
         JOIN accounts a ON a.id = t.to_account_id
         WHERE t.type = 'transfer'
           AND a.account_type = 'liability'
           AND EXTRACT(MONTH FROM t.date) = $1
           AND EXTRACT(YEAR FROM t.date) = $2`,
        [month, year]
      ),
      pool.query(
        `SELECT
           a.name AS account_name,
           COALESCE(SUM(t.amount), 0) AS total
         FROM transactions t
         JOIN accounts a ON a.id = t.to_account_id
         WHERE t.type = 'transfer'
           AND a.account_type = 'liability'
           AND EXTRACT(MONTH FROM t.date) = $1
           AND EXTRACT(YEAR FROM t.date) = $2
         GROUP BY a.id, a.name
         HAVING COALESCE(SUM(t.amount), 0) > 0
         ORDER BY total DESC`,
        [month, year]
      ),
      pool.query(
        `SELECT
           CEIL(EXTRACT(DAY FROM t.date) / 7.0)::int AS week_num,
           COALESCE(SUM(t.amount), 0) AS debt_payments
         FROM transactions t
         JOIN accounts a ON a.id = t.to_account_id
         WHERE t.type = 'transfer'
           AND a.account_type = 'liability'
           AND EXTRACT(MONTH FROM t.date) = $1
           AND EXTRACT(YEAR FROM t.date) = $2
         GROUP BY week_num
         ORDER BY week_num`,
        [month, year]
      ),
    ]);

    return {
      supportsDebtPaymentReporting: true,
      totalDebtPayments: parseFloat(totalResult.rows[0].total),
      debtPaymentsByAccount: byAccountResult.rows.map((row) => ({
        accountName: row.account_name,
        amount: parseFloat(row.total),
      })),
      debtPaymentsByWeek: new Map(
        byWeekResult.rows.map((row) => [
          Number(row.week_num),
          parseFloat(row.debt_payments),
        ])
      ),
    };
  } catch (error) {
    logDbError("getMonthlyDebtPaymentReporting", error);
    console.info(
      "[schema-compat] Monthly debt-payment reporting unavailable; falling back to income/expense only."
    );
    return emptyMonthlyDebtPaymentReport();
  }
}

/**
 * Optional yearly debt-payment matrix rows for Reports yearly views.
 * Isolated so a failing liability query cannot crash getYearlyMatrixData.
 */
async function getYearlyDebtPaymentMatrixRows(year: number): Promise<{
  supportsDebtPaymentReporting: boolean;
  rows: Array<{
    accountId: string;
    accountName: string;
    monthNum: number;
    amount: number;
    lastTransactionDate: Date | string | null;
  }>;
}> {
  const available = await isDebtPaymentReportingAvailable();
  if (!available) {
    return emptyYearlyDebtPaymentMatrix();
  }

  try {
    const result = await pool.query(
      `SELECT
         a.id AS account_id,
         a.name AS account_name,
         EXTRACT(MONTH FROM t.date)::int AS month_num,
         MAX(t.date) AS last_transaction_date,
         COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN accounts a ON a.id = t.to_account_id
       WHERE EXTRACT(YEAR FROM t.date) = $1
         AND t.type = 'transfer'
         AND a.account_type = 'liability'
       GROUP BY a.id, a.name, EXTRACT(MONTH FROM t.date)
       ORDER BY a.name, EXTRACT(MONTH FROM t.date)`,
      [year]
    );

    return {
      supportsDebtPaymentReporting: true,
      rows: result.rows.map((row) => ({
        accountId: row.account_id as string,
        accountName: row.account_name as string,
        monthNum: Number(row.month_num),
        amount: parseFloat(row.total),
        lastTransactionDate: row.last_transaction_date as Date | string | null,
      })),
    };
  } catch (error) {
    logDbError("getYearlyDebtPaymentMatrixRows", error);
    console.info(
      "[schema-compat] Yearly debt-payment matrix unavailable; falling back to expense matrix only."
    );
    return emptyYearlyDebtPaymentMatrix();
  }
}

/**
 * Enhanced (optional) part of the yearly cash flow: monthly debt payments,
 * i.e. transfers into liability accounts for the current year.
 *
 * This depends on the newer loan/liability reporting schema (accounts.account_type).
 * It is intentionally isolated from the always-available income/expense query so
 * that startup can never depend on the optional reporting schema. Any failure here
 * degrades to an empty series instead of crashing the caller.
 */
async function getYearlyDebtPaymentsByMonth(): Promise<Map<number, number>> {
  const empty = new Map<number, number>();

  const available = await isDebtPaymentReportingAvailable();
  if (!available) {
    return empty;
  }

  // Even with the capability check, guard the join/query against a partially
  // migrated schema and fall back to legacy cash-flow logic automatically.
  try {
    const result = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM t.date)::int AS month_num,
         COALESCE(SUM(t.amount), 0) AS debt_payments
       FROM transactions t
       JOIN accounts a ON a.id = t.to_account_id
       WHERE t.type = 'transfer'
         AND a.account_type = 'liability'
         AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY month_num`
    );

    return new Map(
      result.rows.map((row) => [
        Number(row.month_num),
        parseFloat(row.debt_payments),
      ])
    );
  } catch (error) {
    logDbError("getYearlyDebtPaymentsByMonth", error);
    console.info(
      "[schema-compat] Yearly debt-payment reporting unavailable; falling back to income/expense only."
    );
    return empty;
  }
}

/** A safe all-zero 12-month cash-flow series used as a startup-safe fallback. */
function emptyYearlyCashFlow(): CashFlowChartPoint[] {
  return MONTH_LABELS.map((label) => ({
    month: label.toUpperCase(),
    inflow: 0,
    outflow: 0,
    debtPayments: 0,
  }));
}

export async function getYearlyCashFlow(): Promise<CashFlowChartPoint[]> {
  let byMonth: Map<number, { inflow: number; outflow: number }>;

  // Base income/expense series. This never depends on the optional
  // loan/liability reporting schema. Even so, we do not let a base-query
  // failure (missing table, bad connection, broken migration, etc.) crash
  // startup: we log the real underlying error and degrade to a zero series.
  try {
    const result = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM date)::int AS month_num,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS inflow,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS outflow
       FROM transactions
       WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND type IN ('income', 'expense')
       GROUP BY month_num
       ORDER BY month_num`
    );

    byMonth = new Map(
      result.rows.map((row) => [
        Number(row.month_num),
        {
          inflow: parseFloat(row.inflow),
          outflow: parseFloat(row.outflow),
        },
      ])
    );
  } catch (error) {
    // Surface the REAL underlying DB/runtime error, not just the wrapper.
    logDbError("getYearlyCashFlow base income/expense query", error);
    return emptyYearlyCashFlow();
  }

  // Optional enhanced loan reporting. Returns an empty series (all zeros)
  // when the newer schema is missing or partially migrated.
  const debtPaymentsByMonth = await getYearlyDebtPaymentsByMonth();

  return MONTH_LABELS.map((label, index) => {
    const monthNum = index + 1;
    const data = byMonth.get(monthNum);
    return {
      month: label.toUpperCase(),
      inflow: data?.inflow ?? 0,
      outflow: -(data?.outflow ?? 0),
      debtPayments: debtPaymentsByMonth.get(monthNum) ?? 0,
    };
  });
}

export async function getSpendingByGroupThisMonth(): Promise<SpendingByGroup[]> {
  try {
    const result = await pool.query(
      `WITH spending AS (
         SELECT
           COALESCE(NULLIF(TRIM(c.group_name), ''), 'Other') AS group_name,
           COALESCE(SUM(t.amount), 0) AS spent
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.type = 'expense'
           AND ${CURRENT_MONTH_DATE_SQL}
         GROUP BY 1
       ),
       targets AS (
         SELECT
           COALESCE(NULLIF(TRIM(c.group_name), ''), 'Other') AS group_name,
           COALESCE(SUM(b.amount), 0) AS target
         FROM budgets b
         LEFT JOIN categories c ON c.id = b.category_id
         WHERE b.type = 'expense'
         GROUP BY 1
       ),
       group_colors AS (
         SELECT
           group_name,
           color
         FROM (
           SELECT
             COALESCE(NULLIF(TRIM(c.group_name), ''), 'Other') AS group_name,
             COALESCE(c.color, '#9ca3af') AS color,
             ROW_NUMBER() OVER (
               PARTITION BY COALESCE(NULLIF(TRIM(c.group_name), ''), 'Other')
               ORDER BY COALESCE(SUM(t.amount), 0) DESC, c.name
             ) AS rn
           FROM categories c
           LEFT JOIN transactions t
             ON t.category_id = c.id
            AND t.type = 'expense'
            AND ${CURRENT_MONTH_DATE_SQL}
           WHERE c.type = 'expense'
           GROUP BY c.group_name, c.color, c.name
         ) ranked_colors
         WHERE rn = 1
       )
       SELECT
         COALESCE(s.group_name, tg.group_name) AS group_name,
         COALESCE(s.spent, 0) AS spent,
         COALESCE(tg.target, 0) AS target,
         COALESCE(gc.color, '#9ca3af') AS color
       FROM spending s
       FULL OUTER JOIN targets tg ON s.group_name = tg.group_name
       LEFT JOIN group_colors gc
         ON gc.group_name = COALESCE(s.group_name, tg.group_name)
       WHERE COALESCE(s.spent, 0) > 0 OR COALESCE(tg.target, 0) > 0
       ORDER BY COALESCE(s.spent, 0) DESC, group_name ASC`
    );

    return result.rows.map((row) => ({
      name: row.group_name,
      value: parseFloat(row.spent),
      target: parseFloat(row.target),
      color: row.color,
    }));
  } catch (error) {
    console.error("getSpendingByGroupThisMonth error:", error);
    throw new Error("Failed to fetch spending by group");
  }
}

export async function getTransactionsForGroupThisMonth(
  groupName: string
): Promise<GroupTransaction[]> {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.description,
         t.amount,
         t.date,
         COALESCE(c.name, t.category) AS category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense'
         AND ${CURRENT_MONTH_DATE_SQL}
         AND COALESCE(NULLIF(TRIM(c.group_name), ''), 'Other') = $1
       ORDER BY t.date DESC, t.description ASC`,
      [groupName]
    );

    return result.rows.map((row) => ({
      id: row.id,
      description: row.description,
      amount: String(row.amount),
      date: formatDate(row.date),
      category: row.category,
    }));
  } catch (error) {
    console.error("getTransactionsForGroupThisMonth error:", error);
    throw new Error("Failed to fetch group transactions");
  }
}

export async function getMonthlyTargetData(): Promise<MonthlyTargetData> {
  try {
    const [spentResult, targets] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM transactions
         WHERE type = 'expense'
           AND ${CURRENT_MONTH_DATE_SQL}`
      ),
      getGlobalTargets(),
    ]);

    return {
      spent: parseFloat(spentResult.rows[0].spent),
      target: targets.totalExpenseTarget,
    };
  } catch (error) {
    console.error("getMonthlyTargetData error:", error);
    throw new Error("Failed to fetch monthly target data");
  }
}

export async function getReportData(
  month: number,
  year: number
): Promise<ReportData> {
  try {
    // Income/expense reporting never depends on account_type.
    const [totalsResult, categoryResult, cashFlowResult] = await Promise.all([
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
         FROM transactions
         WHERE EXTRACT(MONTH FROM date) = $1
           AND EXTRACT(YEAR FROM date) = $2
           AND type IN ('income', 'expense')`,
        [month, year]
      ),
      pool.query(
        `SELECT
           c.name AS category_name,
           c.color,
           COALESCE(SUM(t.amount), 0) AS total
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE t.type = 'expense'
           AND EXTRACT(MONTH FROM t.date) = $1
           AND EXTRACT(YEAR FROM t.date) = $2
         GROUP BY c.id, c.name, c.color
         HAVING COALESCE(SUM(t.amount), 0) > 0
         ORDER BY total DESC`,
        [month, year]
      ),
      pool.query(
        `SELECT
           CEIL(EXTRACT(DAY FROM date) / 7.0)::int AS week_num,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
         FROM transactions
         WHERE EXTRACT(MONTH FROM date) = $1
           AND EXTRACT(YEAR FROM date) = $2
           AND type IN ('income', 'expense')
         GROUP BY week_num
         ORDER BY week_num`,
        [month, year]
      ),
    ]);

    // Optional loan reporting — never throws; degrades to empty values.
    const debtReporting = await getMonthlyDebtPaymentReporting(month, year);

    const totalIncome = parseFloat(totalsResult.rows[0].total_income);
    const totalExpense = parseFloat(totalsResult.rows[0].total_expense);

    const expensesByCategory: ReportExpenseCategory[] = categoryResult.rows.map(
      (row) => ({
        categoryName: row.category_name,
        amount: parseFloat(row.total),
        color: row.color,
      })
    );

    const weeksInMonth = Math.ceil(new Date(year, month, 0).getDate() / 7);
    const cashFlowByWeek = new Map(
      cashFlowResult.rows.map((row) => [
        Number(row.week_num),
        {
          income: parseFloat(row.income),
          expense: parseFloat(row.expense),
        },
      ])
    );

    const cashFlow: ReportCashFlowPoint[] = Array.from(
      { length: weeksInMonth },
      (_, index) => {
        const weekNum = index + 1;
        const data = cashFlowByWeek.get(weekNum);
        return {
          label: `Week ${weekNum}`,
          income: data?.income ?? 0,
          expense: data?.expense ?? 0,
          debtPayments: debtReporting.debtPaymentsByWeek.get(weekNum) ?? 0,
        };
      }
    );

    return {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      totalDebtPayments: debtReporting.totalDebtPayments,
      debtPaymentsByAccount: debtReporting.debtPaymentsByAccount,
      expensesByCategory,
      cashFlow,
      supportsDebtPaymentReporting: debtReporting.supportsDebtPaymentReporting,
    };
  } catch (error) {
    logDbError("getReportData", error);
    throw new Error("Failed to fetch report data");
  }
}

function emptyMonthMap(): { [monthIndex: number]: number } {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [index + 1, 0])
  ) as { [monthIndex: number]: number };
}

function normalizeMatrixDescription(description: string | null): string {
  const trimmed = description?.trim();
  return trimmed ? trimmed : "Uncategorized detail";
}

function normalizeMatrixGroupName(groupName: string | null | undefined): string {
  const trimmed = groupName?.trim();
  return trimmed ? trimmed : "Ungrouped";
}

interface YearlyMatrixCategoryAccumulator {
  categoryId: string;
  categoryName: string;
  color: string;
  groupName: string;
  months: { [monthIndex: number]: number };
  rowTotal: number;
  lastTransactionDate: string | null;
  details: Map<string, YearlyMatrixDetailRow>;
}

function maxDateString(
  current: string | null,
  candidate: Date | string | null | undefined
): string | null {
  if (!candidate) return current;
  const next =
    typeof candidate === "string"
      ? candidate.split("T")[0]!
      : `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(2, "0")}`;
  if (!current) return next;
  return next > current ? next : current;
}

function createCategoryAccumulator(
  categoryId: string,
  categoryName: string,
  groupName: string | null | undefined,
  color: string | null | undefined
): YearlyMatrixCategoryAccumulator {
  return {
    categoryId,
    categoryName,
    color: color?.trim() || "#94a3b8",
    groupName: normalizeMatrixGroupName(groupName),
    months: emptyMonthMap(),
    rowTotal: 0,
    lastTransactionDate: null,
    details: new Map(),
  };
}

function finalizeCategoryRow(
  accumulator: YearlyMatrixCategoryAccumulator
): YearlyMatrixRow {
  return {
    categoryId: accumulator.categoryId,
    categoryName: accumulator.categoryName,
    color: accumulator.color,
    months: accumulator.months,
    rowTotal: accumulator.rowTotal,
    lastTransactionDate: accumulator.lastTransactionDate,
    details: Array.from(accumulator.details.values()).sort(
      (a, b) => b.rowTotal - a.rowTotal
    ),
  };
}

function buildMatrixGroupsFromAccumulators(
  accumulators: YearlyMatrixCategoryAccumulator[]
): YearlyMatrixGroup[] {
  const groupMap = new Map<string, YearlyMatrixGroup>();

  for (const accumulator of accumulators) {
    const row = finalizeCategoryRow(accumulator);
    let group = groupMap.get(accumulator.groupName);
    if (!group) {
      group = {
        groupName: accumulator.groupName,
        rows: [],
        monthlyTotals: emptyMonthMap(),
        rowTotal: 0,
      };
      groupMap.set(accumulator.groupName, group);
    }

    group.rows.push(row);
    group.rowTotal += row.rowTotal;
    for (let month = 1; month <= 12; month++) {
      group.monthlyTotals[month] =
        (group.monthlyTotals[month] ?? 0) + (row.months[month] ?? 0);
    }
  }

  return Array.from(groupMap.values())
    .sort((a, b) => {
      if (a.groupName === "Ungrouped") return 1;
      if (b.groupName === "Ungrouped") return -1;
      return a.groupName.localeCompare(b.groupName);
    })
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => b.rowTotal - a.rowTotal),
    }));
}

export async function getYearlyMatrixData(
  year: number
): Promise<YearlyMatrixData> {
  try {
    // Income/expense matrix never depends on account_type.
    const result = await pool.query(
      `SELECT
         c.id AS category_id,
         c.name AS category_name,
         c.type AS category_type,
         c.color AS category_color,
         c.group_name,
         t.description,
         EXTRACT(MONTH FROM t.date)::int AS month_num,
         MAX(t.date) AS last_transaction_date,
         COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE EXTRACT(YEAR FROM t.date) = $1
         AND t.type IN ('income', 'expense')
       GROUP BY c.id, c.name, c.type, c.color, c.group_name, t.description, EXTRACT(MONTH FROM t.date)
       ORDER BY c.type, c.group_name, c.name, t.description`,
      [year]
    );

    // Optional loan matrix — never throws; degrades to empty section.
    const debtReporting = await getYearlyDebtPaymentMatrixRows(year);

    const incomeRowMap = new Map<string, YearlyMatrixCategoryAccumulator>();
    const expenseRowMap = new Map<string, YearlyMatrixCategoryAccumulator>();
    const incomeMonthlyTotals = emptyMonthMap();
    const expenseMonthlyTotals = emptyMonthMap();

    for (const row of result.rows) {
      const categoryId = row.category_id as string;
      const categoryType = row.category_type as "income" | "expense";
      const monthNum = Number(row.month_num);
      const amount = parseFloat(row.total);
      const description = normalizeMatrixDescription(row.description as string | null);
      const rowMap =
        categoryType === "income" ? incomeRowMap : expenseRowMap;
      const monthlyTotals =
        categoryType === "income" ? incomeMonthlyTotals : expenseMonthlyTotals;

      const lastTransactionDate = row.last_transaction_date as
        | Date
        | string
        | null;

      let accumulator = rowMap.get(categoryId);
      if (!accumulator) {
        accumulator = createCategoryAccumulator(
          categoryId,
          row.category_name as string,
          row.group_name as string | null,
          row.category_color as string | null
        );
        rowMap.set(categoryId, accumulator);
      }

      accumulator.months[monthNum] = (accumulator.months[monthNum] ?? 0) + amount;
      accumulator.rowTotal += amount;
      accumulator.lastTransactionDate = maxDateString(
        accumulator.lastTransactionDate,
        lastTransactionDate
      );
      monthlyTotals[monthNum] = (monthlyTotals[monthNum] ?? 0) + amount;

      let detailRow = accumulator.details.get(description);
      if (!detailRow) {
        detailRow = {
          description,
          months: emptyMonthMap(),
          rowTotal: 0,
          lastTransactionDate: null,
        };
        accumulator.details.set(description, detailRow);
      }

      detailRow.months[monthNum] = amount;
      detailRow.rowTotal += amount;
      detailRow.lastTransactionDate = maxDateString(
        detailRow.lastTransactionDate,
        lastTransactionDate
      );
    }

    const incomeGroups = buildMatrixGroupsFromAccumulators(
      Array.from(incomeRowMap.values())
    );
    const expenseGroups = buildMatrixGroupsFromAccumulators(
      Array.from(expenseRowMap.values())
    );

    const incomeGrandTotal = incomeGroups.reduce(
      (sum, group) => sum + group.rowTotal,
      0
    );
    const expenseGrandTotal = expenseGroups.reduce(
      (sum, group) => sum + group.rowTotal,
      0
    );

    const netMonthlyTotals = emptyMonthMap();
    for (let month = 1; month <= 12; month++) {
      netMonthlyTotals[month] =
        (incomeMonthlyTotals[month] ?? 0) - (expenseMonthlyTotals[month] ?? 0);
    }

    const debtPaymentRowMap = new Map<string, YearlyMatrixDetailRow>();
    const debtPaymentMonthlyTotals = emptyMonthMap();

    for (const row of debtReporting.rows) {
      let debtRow = debtPaymentRowMap.get(row.accountId);
      if (!debtRow) {
        debtRow = {
          description: row.accountName,
          months: emptyMonthMap(),
          rowTotal: 0,
          lastTransactionDate: null,
        };
        debtPaymentRowMap.set(row.accountId, debtRow);
      }

      debtRow.months[row.monthNum] =
        (debtRow.months[row.monthNum] ?? 0) + row.amount;
      debtRow.rowTotal += row.amount;
      debtRow.lastTransactionDate = maxDateString(
        debtRow.lastTransactionDate,
        row.lastTransactionDate
      );
      debtPaymentMonthlyTotals[row.monthNum] =
        (debtPaymentMonthlyTotals[row.monthNum] ?? 0) + row.amount;
    }

    const debtPaymentRows = Array.from(debtPaymentRowMap.values()).sort(
      (a, b) => b.rowTotal - a.rowTotal
    );
    const debtPaymentGrandTotal = debtPaymentRows.reduce(
      (sum, row) => sum + row.rowTotal,
      0
    );

    return {
      year,
      income: {
        groups: incomeGroups,
        monthlyTotals: incomeMonthlyTotals,
        grandTotal: incomeGrandTotal,
      },
      expenses: {
        groups: expenseGroups,
        monthlyTotals: expenseMonthlyTotals,
        grandTotal: expenseGrandTotal,
      },
      debtPayments: {
        rows: debtPaymentRows,
        monthlyTotals: debtPaymentMonthlyTotals,
        grandTotal: debtPaymentGrandTotal,
      },
      supportsDebtPaymentReporting: debtReporting.supportsDebtPaymentReporting,
      net: {
        monthlyTotals: netMonthlyTotals,
        grandTotal: incomeGrandTotal - expenseGrandTotal,
      },
    };
  } catch (error) {
    logDbError("getYearlyMatrixData", error);
    throw new Error("Failed to fetch yearly matrix data");
  }
}

function revalidateTransactionPages() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/reports");
}

function revalidateBudgetPages() {
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

function revalidateBillPages() {
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

function revalidateAccountPages() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

function revalidateCategoryPages() {
  revalidatePath("/categories");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/reports");
}

export async function getBudgets(): Promise<Budget[]> {
  try {
    const result = await pool.query(
      `SELECT b.id, b.amount, b.type, b.category_id,
              COALESCE(c.name, b.category) AS category
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       ORDER BY b.type, category`
    );

    return result.rows.map((row) => ({
      id: row.id,
      category: row.category,
      categoryId: row.category_id,
      amount: String(row.amount),
      type: row.type,
    }));
  } catch (error) {
    console.error("getBudgets error:", error);
    throw new Error("Failed to fetch budgets");
  }
}

export async function getGlobalTargets(): Promise<GlobalTargets> {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income_target,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense_target
       FROM budgets`
    );

    const row = result.rows[0];
    return {
      totalIncomeTarget: parseFloat(row.total_income_target),
      totalExpenseTarget: parseFloat(row.total_expense_target),
    };
  } catch (error) {
    console.error("getGlobalTargets error:", error);
    throw new Error("Failed to fetch global targets");
  }
}

export async function createBudget(data: BudgetInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO budgets (category_id, amount, type, category)
       SELECT $1, $2, $3, c.name
       FROM categories c
       WHERE c.id = $1`,
      [data.categoryId, data.amount, data.type]
    );
    revalidateBudgetPages();
  } catch (error) {
    console.error("createBudget error:", error);
    throw new Error("Failed to create budget");
  }
}

export async function updateBudget(id: string, data: BudgetInput): Promise<void> {
  try {
    await pool.query(
      `UPDATE budgets b
       SET category_id = $1, amount = $2, type = $3,
           category = (SELECT name FROM categories WHERE id = $1)
       WHERE b.id = $4`,
      [data.categoryId, data.amount, data.type, id]
    );
    revalidateBudgetPages();
  } catch (error) {
    console.error("updateBudget error:", error);
    throw new Error("Failed to update budget");
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    await pool.query(`DELETE FROM budgets WHERE id = $1`, [id]);
    revalidateBudgetPages();
  } catch (error) {
    console.error("deleteBudget error:", error);
    throw new Error("Failed to delete budget");
  }
}

const SCHEDULED_BILL_SELECT = `
         b.id,
         b.title,
         b.amount,
         b.due_date,
         b.category_id,
         b.account_id,
         b.is_paid,
         b.created_at,
         b.updated_at,
         c.name AS category_name,
         c.color AS category_color,
         a.name AS account_name`;

const SCHEDULED_BILL_JOINS = `
       FROM scheduled_bills b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN accounts a ON a.id = b.account_id`;

async function validateScheduledBillAccountId(
  accountId: string | null | undefined
): Promise<void> {
  if (!accountId) {
    return;
  }

  const result = await pool.query(`SELECT id FROM accounts WHERE id = $1`, [
    accountId,
  ]);

  if (result.rows.length === 0) {
    throw new Error("Please select a valid account.");
  }
}

export async function getScheduledBillsForMonth(
  year: number,
  month: number
): Promise<ScheduledBill[]> {
  try {
    const result = await pool.query(
      `SELECT
${SCHEDULED_BILL_SELECT}
${SCHEDULED_BILL_JOINS}
       WHERE EXTRACT(YEAR FROM b.due_date) = $1
         AND EXTRACT(MONTH FROM b.due_date) = $2
       ORDER BY b.due_date ASC, b.title ASC`,
      [year, month]
    );

    return result.rows.map(mapScheduledBillRow);
  } catch (error) {
    console.error("getScheduledBillsForMonth error:", error);
    throw new Error("Failed to fetch scheduled bills");
  }
}

export async function getBudgetSummaryForMonth(
  year: number,
  month: number
): Promise<BudgetSummary> {
  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_planned,
         COALESCE(SUM(CASE WHEN is_paid THEN amount ELSE 0 END), 0) AS total_paid
       FROM scheduled_bills
       WHERE EXTRACT(YEAR FROM due_date) = $1
         AND EXTRACT(MONTH FROM due_date) = $2`,
      [year, month]
    );

    const row = result.rows[0];
    const totalPlanned = parseFloat(row.total_planned);
    const totalPaid = parseFloat(row.total_paid);

    return {
      totalPlanned,
      totalPaid,
      remaining: totalPlanned - totalPaid,
    };
  } catch (error) {
    console.error("getBudgetSummaryForMonth error:", error);
    throw new Error("Failed to fetch budget summary");
  }
}

export async function getCurrentMonthBudgetSummary(): Promise<BudgetSummary> {
  const now = new Date();
  return getBudgetSummaryForMonth(now.getFullYear(), now.getMonth() + 1);
}

export async function getUnpaidScheduledBillsThisMonth(): Promise<ScheduledBill[]> {
  try {
    const now = new Date();
    const bills = await getScheduledBillsForMonth(
      now.getFullYear(),
      now.getMonth() + 1
    );

    return bills.filter((bill) => !bill.isPaid);
  } catch (error) {
    console.error("getUnpaidScheduledBillsThisMonth error:", error);
    throw new Error("Failed to fetch unpaid bills");
  }
}

export async function getDueSoonScheduledBills(): Promise<ScheduledBill[]> {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = getLocalDateString(today);
    const tomorrowStr = getLocalDateString(tomorrow);

    const result = await pool.query(
      `SELECT
${SCHEDULED_BILL_SELECT}
${SCHEDULED_BILL_JOINS}
       WHERE b.is_paid = false
         AND b.due_date IN ($1::date, $2::date)
       ORDER BY b.due_date ASC, b.title ASC`,
      [todayStr, tomorrowStr]
    );

    return result.rows.map(mapScheduledBillRow);
  } catch (error) {
    console.error("getDueSoonScheduledBills error:", error);
    throw new Error("Failed to fetch due soon bills");
  }
}

export async function createScheduledBill(
  data: ScheduledBillInput
): Promise<void> {
  try {
    await validateScheduledBillAccountId(data.accountId);

    await pool.query(
      `INSERT INTO scheduled_bills (title, amount, due_date, category_id, account_id)
       VALUES ($1, $2, $3::date, $4, $5)`,
      [
        data.title,
        data.amount,
        normalizeDateInput(data.dueDate),
        data.categoryId ?? null,
        data.accountId ?? null,
      ]
    );
    revalidateBillPages();
  } catch (error) {
    console.error("createScheduledBill error:", error);
    throw new Error("Failed to create scheduled bill");
  }
}

export async function updateScheduledBill(
  id: string,
  data: ScheduledBillInput
): Promise<void> {
  try {
    await validateScheduledBillAccountId(data.accountId);

    const result = await pool.query(
      `UPDATE scheduled_bills
       SET title = $1,
           amount = $2,
           due_date = $3::date,
           category_id = $4,
           account_id = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        data.title,
        data.amount,
        normalizeDateInput(data.dueDate),
        data.categoryId ?? null,
        data.accountId ?? null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      throw new Error("Bill not found.");
    }

    revalidateBillPages();
  } catch (error) {
    console.error("updateScheduledBill error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update scheduled bill");
  }
}

export async function deleteScheduledBill(id: string): Promise<void> {
  try {
    const result = await pool.query(
      `DELETE FROM scheduled_bills WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error("Bill not found.");
    }

    revalidateBillPages();
  } catch (error) {
    console.error("deleteScheduledBill error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete scheduled bill");
  }
}

export async function payScheduledBill(
  billId: string,
  accountId: string
): Promise<void> {
  const client = await pool.connect();
  const today = getLocalDateString();

  try {
    await client.query("BEGIN");

    const billResult = await client.query(
      `SELECT id, title, amount, category_id, is_paid
       FROM scheduled_bills
       WHERE id = $1
       FOR UPDATE`,
      [billId]
    );

    if (billResult.rows.length === 0) {
      throw new Error("Bill not found.");
    }

    const bill = billResult.rows[0];

    if (bill.is_paid) {
      throw new Error("This bill is already marked as paid.");
    }

    const accountResult = await client.query(
      `SELECT id FROM accounts WHERE id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error("Please select a valid account.");
    }

    let categoryId: string = bill.category_id;
    let categoryName = "Bills";

    if (categoryId) {
      const categoryResult = await client.query(
        `SELECT name FROM categories WHERE id = $1`,
        [categoryId]
      );
      categoryName = categoryResult.rows[0]?.name ?? "Bills";
    } else {
      const categoryResult = await client.query(
        `SELECT id, name FROM categories
         WHERE type = 'expense'
         ORDER BY CASE WHEN name = 'Other' THEN 0 ELSE 1 END, name
         LIMIT 1`
      );

      if (categoryResult.rows.length === 0) {
        throw new Error("No expense category available for this payment.");
      }

      categoryId = categoryResult.rows[0].id;
      categoryName = categoryResult.rows[0].name;
    }

    await client.query(
      `UPDATE scheduled_bills
       SET is_paid = true, updated_at = NOW()
       WHERE id = $1`,
      [billId]
    );

    await client.query(
      `INSERT INTO transactions (
         description, amount, type, category, date, account_id, category_id
       )
       VALUES ($1, $2, 'expense', $3, $4::date, $5, $6)`,
      [bill.title, bill.amount, categoryName, today, accountId, categoryId]
    );

    await client.query("COMMIT");
    revalidateBillPages();
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("payScheduledBill error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to pay scheduled bill");
  } finally {
    client.release();
  }
}

export async function markScheduledBillAsPaid(billId: string): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE scheduled_bills
       SET is_paid = true, updated_at = NOW()
       WHERE id = $1 AND is_paid = false
       RETURNING id`,
      [billId]
    );

    if (result.rowCount === 0) {
      throw new Error("Bill not found or already paid.");
    }

    revalidateBillPages();
  } catch (error) {
    console.error("markScheduledBillAsPaid error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to mark bill as paid");
  }
}

function mapScheduledBillRow(row: {
  id: string;
  title: string;
  amount: string | number;
  due_date: Date | string;
  category_id: string | null;
  account_id: string | null;
  is_paid: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  category_name: string | null;
  category_color: string | null;
  account_name: string | null;
}): ScheduledBill {
  return {
    id: row.id,
    title: row.title,
    amount: String(row.amount),
    dueDate: formatDate(row.due_date),
    categoryId: row.category_id ?? null,
    categoryName: row.category_name ?? null,
    categoryColor: row.category_color ?? null,
    accountId: row.account_id ?? null,
    accountName: row.account_name ?? null,
    isPaid: row.is_paid,
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}

export async function createTransaction(data: TransactionInput): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (data.type === "transfer") {
      if (!data.toAccountId) {
        throw new Error("Please select a destination account.");
      }

      if (data.accountId === data.toAccountId) {
        throw new Error("From and To accounts must be different.");
      }

      const categoryResult = await client.query(
        `SELECT id FROM categories WHERE name = 'Transfer' LIMIT 1`
      );

      if (categoryResult.rows.length === 0) {
        throw new Error(
          "Transfer category is missing. Run transfers-init.sql migration."
        );
      }

      const transferCategoryId = categoryResult.rows[0].id;

      await client.query(
        `INSERT INTO transactions (
           description, amount, type, category, date, account_id, to_account_id, category_id
         )
         VALUES ($1, $2, 'transfer', 'Transfer', $3::date, $4, $5, $6)`,
        [
          data.description,
          data.amount,
          normalizeDateInput(data.date),
          data.accountId,
          data.toAccountId,
          transferCategoryId,
        ]
      );
    } else {
      if (!data.categoryId) {
        throw new Error("Please select a category.");
      }

      await client.query(
        `INSERT INTO transactions (description, amount, type, category, date, account_id, category_id)
         SELECT $1, $2, $3, c.name, $4::date, $5, $6
         FROM categories c
         WHERE c.id = $6`,
        [
          data.description,
          data.amount,
          data.type,
          normalizeDateInput(data.date),
          data.accountId,
          data.categoryId,
        ]
      );
    }

    await client.query("COMMIT");
    revalidateTransactionPages();
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createTransaction error:", error);
    if (error instanceof Error && error.message.includes("Please select")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("must be different")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("Transfer category")) {
      throw error;
    }
    throw new Error("Failed to create transaction");
  } finally {
    client.release();
  }
}

export async function updateTransaction(
  id: string,
  data: TransactionInput
): Promise<void> {
  if (data.type === "transfer") {
    throw new Error("Editing transfers is not supported yet.");
  }

  try {
    await pool.query(
      `UPDATE transactions t
       SET description = $1, amount = $2, type = $3, date = $4::date, account_id = $5,
           category_id = $6, to_account_id = NULL,
           category = (SELECT name FROM categories WHERE id = $6)
       WHERE t.id = $7`,
      [
        data.description,
        data.amount,
        data.type,
        normalizeDateInput(data.date),
        data.accountId,
        data.categoryId,
        id,
      ]
    );
    revalidateTransactionPages();
  } catch (error) {
    console.error("updateTransaction error:", error);
    throw new Error("Failed to update transaction");
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await pool.query(`DELETE FROM transactions WHERE id = $1`, [id]);
    revalidateTransactionPages();
  } catch (error) {
    console.error("deleteTransaction error:", error);
    throw new Error("Failed to delete transaction");
  }
}
