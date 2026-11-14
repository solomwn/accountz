"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Search,
} from "lucide-react";
import type { Account, Category, Transaction } from "@/app/actions";
import { CreateTransactionModal } from "@/components/transactions/CreateTransactionModal";
import { TransactionActionButtons } from "@/components/transactions/transaction-action-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import {
  formatCurrency,
  getDefaultTransactionDateForViewedMonth,
  toDateOnlyString,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "income" | "expense" | "transfer";

interface TransactionsListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const ROW_GRID_CLASS =
  "grid grid-cols-[auto_5.5rem_6.5rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] items-center gap-x-4";

function parseTransactionDate(date: string): Date {
  const [year, month, day] = toDateOnlyString(date).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatRowDate(date: string): string {
  const parsed = parseTransactionDate(date);
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = parsed.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month}`;
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getPayeeIconStyle(
  color: string | undefined,
  type: Transaction["type"]
): CSSProperties {
  if (color) {
    return {
      backgroundColor: `${color}18`,
      color,
    };
  }

  if (type === "transfer") {
    return { backgroundColor: "#ede9fe", color: "#7c3aed" };
  }

  return type === "income"
    ? { backgroundColor: "#ecfdf5", color: "#059669" }
    : { backgroundColor: "#f1f5f9", color: "#64748b" };
}

function getAccountLabel(
  transaction: Transaction,
  accounts: Account[]
): string {
  const fromAccount = accounts.find(
    (account) => account.id === transaction.accountId
  );
  const toAccount = transaction.toAccountId
    ? accounts.find((account) => account.id === transaction.toAccountId)
    : null;

  if (transaction.type === "transfer") {
    return `${fromAccount?.name ?? "Account"} → ${toAccount?.name ?? "Account"}`;
  }

  return fromAccount?.name ?? "—";
}

interface TransactionRowProps {
  transaction: Transaction;
  categoryColor?: string;
  accounts: Account[];
  categories: Category[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

function TransactionRow({
  transaction,
  categoryColor,
  accounts,
  categories,
  selected,
  onToggleSelect,
}: TransactionRowProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const initial = transaction.description.trim().charAt(0).toUpperCase() || "?";
  const iconStyle = getPayeeIconStyle(categoryColor, transaction.type);
  const amount = parseFloat(transaction.amount);

  return (
    <article
      className={cn(
        ROW_GRID_CLASS,
        "rounded-xl border border-slate-100/90 bg-white px-4 py-3 text-sm shadow-sm transition-colors",
        "hover:border-slate-200 hover:shadow-md",
        selected && "border-violet-200 bg-violet-50/70"
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Select ${transaction.description}`}
        onClick={() => onToggleSelect(transaction.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          selected
            ? "border-violet-500 bg-violet-500 text-white"
            : "border-violet-300 bg-white hover:border-violet-400"
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </button>

      <p className="truncate text-slate-600">{formatRowDate(transaction.date)}</p>

      <p
        className={cn(
          "truncate font-semibold tabular-nums",
          isIncome ? "text-emerald-600" : "text-slate-900"
        )}
      >
        {isIncome ? "+" : isTransfer ? "" : "−"}
        {formatCurrency(amount)}
      </p>

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={iconStyle}
        >
          {categoryColor && !isTransfer ? (
            initial
          ) : (
            <Receipt className="h-3.5 w-3.5" strokeWidth={2.25} />
          )}
        </div>
        <p className="truncate font-medium text-slate-900">
          {transaction.description}
        </p>
      </div>

      <p className="truncate text-slate-600">
        {getAccountLabel(transaction, accounts)}
      </p>

      <p className="truncate text-slate-600">
        {isTransfer ? "Transfer" : transaction.category}
      </p>

      <div className="flex justify-end">
        <TransactionActionButtons
          transaction={transaction}
          accounts={accounts}
          categories={categories}
        />
      </div>
    </article>
  );
}

export function TransactionsList({
  transactions,
  accounts,
  categories,
}: TransactionsListProps) {
  const today = new Date();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const categoryColorById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.color])),
    [categories]
  );

  const filteredTransactions = useMemo(() => {
    const searchQuery = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionDate = parseTransactionDate(transaction.date);

      if (
        transactionDate.getMonth() !== month ||
        transactionDate.getFullYear() !== year
      ) {
        return false;
      }

      if (typeFilter === "all") {
        if (transaction.type !== "income" && transaction.type !== "expense") {
          return false;
        }
      } else if (transaction.type !== typeFilter) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      return (
        transaction.description.toLowerCase().includes(searchQuery) ||
        transaction.category.toLowerCase().includes(searchQuery)
      );
    });
  }, [transactions, month, year, typeFilter, search]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.id.localeCompare(a.id);
      }),
    [filteredTransactions]
  );

  const allVisibleSelected =
    sortedTransactions.length > 0 &&
    sortedTransactions.every((transaction) => selectedIds.has(transaction.id));

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(sortedTransactions.map((transaction) => transaction.id)));
  }

  function goToPreviousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((current) => current - 1);
      return;
    }

    setMonth((current) => current - 1);
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((current) => current + 1);
      return;
    }

    setMonth((current) => current + 1);
  }

  const filterPills: { label: string; value: TypeFilter }[] = [
    { label: "All", value: "all" },
    { label: "Income", value: "income" },
    { label: "Expenses", value: "expense" },
    { label: "Transfers", value: "transfer" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track income and spending across your accounts.
          </p>
        </div>
        <CreateTransactionModal
          accounts={accounts}
          categories={categories}
          defaultDate={getDefaultTransactionDateForViewedMonth(year, month)}
          trigger={
            <Button variant="premium" className="w-full sm:w-auto">
              Add Transaction
            </Button>
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              className="h-10 border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:ring-slate-300"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterPills.map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setTypeFilter(pill.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    typeFilter === pill.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[9rem] text-center text-sm font-medium text-slate-700">
                {formatMonthLabel(year, month)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <TableEmptyState
            icon={Receipt}
            message="No transactions recorded yet."
            description="Add your first income or expense to start tracking your finances."
          />
        ) : filteredTransactions.length === 0 ? (
          <TableEmptyState
            icon={Receipt}
            message="No transactions match your filters."
            description="Try another month, search term, or filter to see more results."
          />
        ) : (
          <div className="overflow-x-auto bg-slate-50/60 p-4 sm:p-5">
            <div className="min-w-[56rem] space-y-2">
              <header
                className={cn(
                  ROW_GRID_CLASS,
                  "px-4 pb-1 text-xs font-medium uppercase tracking-wide text-violet-400"
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={allVisibleSelected}
                  aria-label="Select all transactions"
                  onClick={toggleSelectAll}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    allVisibleSelected
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-violet-300 bg-white hover:border-violet-400"
                  )}
                >
                  {allVisibleSelected ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : null}
                </button>
                <span>Date</span>
                <span>Amount</span>
                <span>Payment name</span>
                <span>Method</span>
                <span>Category</span>
                <span className="sr-only">Actions</span>
              </header>

              {sortedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  categoryColor={categoryColorById.get(transaction.categoryId)}
                  accounts={accounts}
                  categories={categories}
                  selected={selectedIds.has(transaction.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
