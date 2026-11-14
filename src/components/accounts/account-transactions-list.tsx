"use client";

import { useMemo } from "react";
import { Receipt } from "lucide-react";
import type { AccountBalance, Transaction } from "@/app/actions";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AccountTransactionRow extends Transaction {
  runningBalance: number;
  debit: number | null;
  credit: number | null;
}

function getTransactionDelta(transaction: Transaction, accountId: string): number {
  if (transaction.type === "transfer") {
    if (transaction.accountId === accountId) {
      return -parseFloat(transaction.amount);
    }
    if (transaction.toAccountId === accountId) {
      return parseFloat(transaction.amount);
    }
    return 0;
  }

  if (transaction.accountId !== accountId) {
    return 0;
  }

  return transaction.type === "income"
    ? parseFloat(transaction.amount)
    : -parseFloat(transaction.amount);
}

function buildAccountTransactionRows(
  account: AccountBalance,
  transactions: Transaction[]
): AccountTransactionRow[] {
  const sortedAsc = [...transactions].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });

  let balance = parseFloat(account.openingBalance);
  const rows: AccountTransactionRow[] = [];

  for (const transaction of sortedAsc) {
    const amount = parseFloat(transaction.amount);
    const delta = getTransactionDelta(transaction, account.id);
    balance += delta;

    const isDebit =
      transaction.type === "expense" ||
      (transaction.type === "transfer" && transaction.accountId === account.id);
    const isCredit =
      transaction.type === "income" ||
      (transaction.type === "transfer" && transaction.toAccountId === account.id);

    rows.push({
      ...transaction,
      runningBalance: balance,
      debit: isDebit ? amount : null,
      credit: isCredit ? amount : null,
    });
  }

  return rows.reverse();
}

interface AccountTransactionsListProps {
  account: AccountBalance;
  transactions: Transaction[];
}

export function AccountTransactionsList({
  account,
  transactions,
}: AccountTransactionsListProps) {
  const rows = useMemo(
    () => buildAccountTransactionRows(account, transactions),
    [account, transactions]
  );

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <TableEmptyState
          icon={Receipt}
          message="No transactions for this account yet."
          description="Transactions linked to this account will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[minmax(0,2fr)_6.5rem_6.5rem_7.5rem] gap-4 border-b border-slate-200 bg-slate-100/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Particulars</span>
        <span className="text-right">Debit</span>
        <span className="text-right">Credit</span>
        <span className="text-right">Balance</span>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,2fr)_6.5rem_6.5rem_7.5rem] gap-4 px-5 py-4 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">
                {row.description}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {formatDisplayDate(row.date)}
              </p>
            </div>
            <p className="text-right tabular-nums text-slate-700">
              {row.debit != null ? formatCurrency(row.debit) : "—"}
            </p>
            <p
              className={cn(
                "text-right tabular-nums",
                row.credit != null && row.credit > 0
                  ? "text-green-600"
                  : "text-slate-700"
              )}
            >
              {row.credit != null ? formatCurrency(row.credit) : "—"}
            </p>
            <p
              className={cn(
                "text-right font-medium tabular-nums",
                row.runningBalance >= 0 ? "text-slate-800" : "text-rose-600"
              )}
            >
              {formatCurrency(row.runningBalance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
