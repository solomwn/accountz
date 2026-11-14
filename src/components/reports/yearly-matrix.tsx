"use client";

import { Fragment } from "react";
import type { YearlyMatrixData } from "@/app/actions";
import { formatCurrency } from "@/lib/format";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_INDICES = Array.from({ length: 12 }, (_, index) => index + 1);
const COLUMN_COUNT = MONTH_INDICES.length + 2;

export type YearlyMatrixGrouping = "group" | "category";

interface YearlyMatrixProps {
  data: YearlyMatrixData;
  grouping?: YearlyMatrixGrouping;
}

interface MatrixPayeeRow {
  payeeName: string;
  categoryName: string;
  color: string;
  months: { [monthIndex: number]: number };
}

interface MatrixGroup {
  groupName: string;
  rows: MatrixPayeeRow[];
}

function upsertMatrixPayee(
  payeeMap: Map<string, MatrixPayeeRow>,
  payeeName: string,
  categoryName: string,
  color: string,
  months: { [monthIndex: number]: number }
) {
  let existing = payeeMap.get(payeeName);
  if (!existing) {
    existing = {
      payeeName,
      categoryName,
      color: color || "#94a3b8",
      months: Object.fromEntries(MONTH_INDICES.map((month) => [month, 0])),
    };
    payeeMap.set(payeeName, existing);
  }

  for (const month of MONTH_INDICES) {
    existing.months[month] =
      (existing.months[month] ?? 0) + (months[month] ?? 0);
  }
}

function buildExpenseMatrix(data: YearlyMatrixData): MatrixGroup[] {
  const groups = new Map<string, Map<string, MatrixPayeeRow>>();

  for (const group of data.expenses.groups) {
    let payeeMap = groups.get(group.groupName);
    if (!payeeMap) {
      payeeMap = new Map();
      groups.set(group.groupName, payeeMap);
    }

    for (const row of group.rows) {
      if (row.details.length > 0) {
        for (const detail of row.details) {
          upsertMatrixPayee(
            payeeMap,
            detail.description,
            row.categoryName,
            row.color,
            detail.months
          );
        }
      } else {
        upsertMatrixPayee(
          payeeMap,
          row.categoryName,
          row.categoryName,
          row.color,
          row.months
        );
      }
    }
  }

  return Array.from(groups.entries())
    .map(([groupName, payeeMap]) => ({
      groupName,
      rows: Array.from(payeeMap.values())
        .filter((row) =>
          MONTH_INDICES.some((month) => (row.months[month] ?? 0) > 0)
        )
        .sort((a, b) => a.payeeName.localeCompare(b.payeeName)),
    }))
    .filter((group) => group.rows.length > 0)
    .sort((a, b) => {
      if (a.groupName === "Ungrouped") return 1;
      if (b.groupName === "Ungrouped") return -1;
      return a.groupName.localeCompare(b.groupName);
    });
}

function buildExpenseMatrixByCategory(data: YearlyMatrixData): MatrixGroup[] {
  const categories = new Map<string, Map<string, MatrixPayeeRow>>();

  for (const group of data.expenses.groups) {
    for (const row of group.rows) {
      let payeeMap = categories.get(row.categoryName);
      if (!payeeMap) {
        payeeMap = new Map();
        categories.set(row.categoryName, payeeMap);
      }

      if (row.details.length > 0) {
        for (const detail of row.details) {
          upsertMatrixPayee(
            payeeMap,
            detail.description,
            row.categoryName,
            row.color,
            detail.months
          );
        }
      } else {
        upsertMatrixPayee(
          payeeMap,
          row.categoryName,
          row.categoryName,
          row.color,
          row.months
        );
      }
    }
  }

  return Array.from(categories.entries())
    .map(([categoryName, payeeMap]) => ({
      groupName: categoryName,
      rows: Array.from(payeeMap.values())
        .filter((row) =>
          MONTH_INDICES.some((month) => (row.months[month] ?? 0) > 0)
        )
        .sort((a, b) => a.payeeName.localeCompare(b.payeeName)),
    }))
    .filter((group) => group.rows.length > 0)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
}

function MatrixAmountCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-slate-300">-</span>;
  }

  return (
    <span className="font-bold tabular-nums leading-tight text-slate-900">
      {formatCurrency(value)}
    </span>
  );
}

function sumPayeeYear(row: MatrixPayeeRow): number {
  return MONTH_INDICES.reduce(
    (sum, month) => sum + (row.months[month] ?? 0),
    0
  );
}

function sumGroupYear(group: MatrixGroup): number {
  return group.rows.reduce((sum, row) => sum + sumPayeeYear(row), 0);
}

function ExpenseMatrixTable({
  data,
  matrixGroups,
}: {
  data: YearlyMatrixData;
  matrixGroups: MatrixGroup[];
}) {
  const monthHeaders = MONTH_INDICES.map(
    (month) => `${MONTH_NAMES[month - 1]!.slice(0, 3)} ${data.year}`
  );
  const yearGrandTotal = data.expenses.grandTotal;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <table className="w-full min-w-[60rem] border-separate border-spacing-y-1 text-left text-xs leading-tight">
        <thead>
          <tr className="text-slate-500">
            <th className="sticky left-0 top-0 z-20 w-36 bg-slate-50 px-3 py-1.5 font-medium">
              Category / Payee
            </th>
            {monthHeaders.map((label) => (
              <th
                key={label}
                className="sticky top-0 z-10 min-w-[5.5rem] bg-slate-50 px-2 py-1.5 text-right font-medium"
              >
                {label}
              </th>
            ))}
            <th className="sticky top-0 z-10 min-w-[6rem] bg-slate-50 px-3 py-1.5 text-right font-semibold text-slate-700">
              Yearly Total
            </th>
          </tr>
        </thead>
        <tbody>
          {matrixGroups.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMN_COUNT}
                className="rounded-lg bg-white px-3 py-8 text-center text-sm text-slate-400 shadow-sm"
              >
                No expense transactions recorded for {data.year}.
              </td>
            </tr>
          ) : (
            matrixGroups.map((group) => (
              <Fragment key={group.groupName}>
                <tr>
                  <td
                    colSpan={COLUMN_COUNT - 1}
                    className="border-b border-slate-200 pb-1 pt-3 text-xs font-bold uppercase leading-tight tracking-widest text-slate-500"
                  >
                    {group.groupName}
                  </td>
                  <td className="border-b border-slate-200 pb-1 pt-3 text-right text-xs font-bold leading-tight tabular-nums text-slate-700">
                    {formatCurrency(sumGroupYear(group))}
                  </td>
                </tr>
                {group.rows.map((row) => {
                  const payeeYearTotal = sumPayeeYear(row);

                  return (
                    <tr
                      key={`${group.groupName}-${row.payeeName}`}
                      className="group bg-white shadow-sm transition-colors hover:bg-slate-50"
                    >
                      <td className="sticky left-0 z-10 w-36 overflow-hidden rounded-l-lg border-y border-l border-slate-100 bg-white">
                        <div
                          className="flex items-center border-l-4 px-3 py-1"
                          style={{ borderLeftColor: row.color }}
                        >
                          <span className="truncate text-xs font-semibold leading-tight text-slate-900">
                            {row.payeeName}
                          </span>
                        </div>
                      </td>
                      {MONTH_INDICES.map((month) => (
                        <td
                          key={month}
                          className="border-y border-slate-100 bg-white px-4 py-1 text-right text-xs font-medium leading-tight text-slate-700"
                        >
                          <MatrixAmountCell value={row.months[month] ?? 0} />
                        </td>
                      ))}
                      <td className="rounded-r-lg border-y border-r border-l border-slate-200 bg-slate-50 px-4 py-1 text-right font-bold leading-tight text-slate-900">
                        <MatrixAmountCell value={payeeYearTotal} />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))
          )}
          <tr className="font-bold text-slate-900">
            <td className="sticky left-0 z-10 rounded-l-lg border border-slate-200 bg-slate-100 px-4 py-3">
              Monthly Total
            </td>
            {MONTH_INDICES.map((month) => (
              <td
                key={month}
                className="border-y border-slate-200 bg-slate-100 px-4 py-3 text-right tabular-nums"
              >
                {(data.expenses.monthlyTotals[month] ?? 0) === 0 ? (
                  <span className="text-slate-300">-</span>
                ) : (
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.expenses.monthlyTotals[month] ?? 0)}
                  </span>
                )}
              </td>
            ))}
            <td className="rounded-r-lg border border-slate-200 bg-slate-100 px-4 py-3 text-right tabular-nums">
              {yearGrandTotal === 0 ? (
                <span className="text-slate-300">-</span>
              ) : (
                <span className="font-bold text-red-600">
                  {formatCurrency(yearGrandTotal)}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function YearlyMatrix({
  data,
  grouping = "group",
}: YearlyMatrixProps) {
  const matrixGroups =
    grouping === "category"
      ? buildExpenseMatrixByCategory(data)
      : buildExpenseMatrix(data);

  return (
    <div className="space-y-6">
      <ExpenseMatrixTable data={data} matrixGroups={matrixGroups} />
      {data.supportsDebtPaymentReporting ? (
        <DebtPaymentsMatrixTable data={data} />
      ) : null}
    </div>
  );
}

const DEBT_PAYMENT_COLOR = "#6366f1";

function DebtPaymentsMatrixTable({ data }: { data: YearlyMatrixData }) {
  const monthHeaders = MONTH_INDICES.map(
    (month) => `${MONTH_NAMES[month - 1]!.slice(0, 3)} ${data.year}`
  );
  const rows = data.debtPayments.rows;
  const yearGrandTotal = data.debtPayments.grandTotal;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Loan Principal Paid
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Transfers to loan accounts — not counted as expenses
        </p>
      </div>
      <table className="w-full min-w-[60rem] border-separate border-spacing-y-1 text-left text-xs leading-tight">
        <thead>
          <tr className="text-slate-500">
            <th className="sticky left-0 top-0 z-20 w-36 bg-slate-50 px-3 py-1.5 font-medium">
              Loan Account
            </th>
            {monthHeaders.map((label) => (
              <th
                key={label}
                className="sticky top-0 z-10 min-w-[5.5rem] bg-slate-50 px-2 py-1.5 text-right font-medium"
              >
                {label}
              </th>
            ))}
            <th className="sticky top-0 z-10 min-w-[6rem] bg-slate-50 px-3 py-1.5 text-right font-semibold text-slate-700">
              Yearly Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMN_COUNT}
                className="rounded-lg bg-white px-3 py-8 text-center text-sm text-slate-400 shadow-sm"
              >
                No loan principal payments recorded for {data.year}.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.description}
                className="group bg-white shadow-sm transition-colors hover:bg-slate-50"
              >
                <td className="sticky left-0 z-10 w-36 overflow-hidden rounded-l-lg border-y border-l border-slate-100 bg-white">
                  <div
                    className="flex items-center border-l-4 px-3 py-1"
                    style={{ borderLeftColor: DEBT_PAYMENT_COLOR }}
                  >
                    <span className="truncate text-xs font-semibold leading-tight text-slate-900">
                      {row.description}
                    </span>
                  </div>
                </td>
                {MONTH_INDICES.map((month) => (
                  <td
                    key={month}
                    className="border-y border-slate-100 bg-white px-4 py-1 text-right text-xs font-medium leading-tight text-slate-700"
                  >
                    <MatrixAmountCell value={row.months[month] ?? 0} />
                  </td>
                ))}
                <td className="rounded-r-lg border-y border-r border-l border-slate-200 bg-slate-50 px-4 py-1 text-right font-bold leading-tight text-slate-900">
                  <MatrixAmountCell value={row.rowTotal} />
                </td>
              </tr>
            ))
          )}
          <tr className="font-bold text-slate-900">
            <td className="sticky left-0 z-10 rounded-l-lg border border-slate-200 bg-slate-100 px-4 py-3">
              Monthly Total
            </td>
            {MONTH_INDICES.map((month) => (
              <td
                key={month}
                className="border-y border-slate-200 bg-slate-100 px-4 py-3 text-right tabular-nums"
              >
                {(data.debtPayments.monthlyTotals[month] ?? 0) === 0 ? (
                  <span className="text-slate-300">-</span>
                ) : (
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(data.debtPayments.monthlyTotals[month] ?? 0)}
                  </span>
                )}
              </td>
            ))}
            <td className="rounded-r-lg border border-slate-200 bg-slate-100 px-4 py-3 text-right tabular-nums">
              {yearGrandTotal === 0 ? (
                <span className="text-slate-300">-</span>
              ) : (
                <span className="font-bold text-indigo-600">
                  {formatCurrency(yearGrandTotal)}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
