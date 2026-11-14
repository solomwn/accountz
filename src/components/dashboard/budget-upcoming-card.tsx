"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Account, Category, ScheduledBill } from "@/app/actions";
import {
  CreateTransactionModal,
  type TransactionPrefill,
} from "@/components/transactions/CreateTransactionModal";
import { getDefaultCategoryId } from "@/lib/category-utils";
import { formatCurrency, getLocalDateString } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BudgetUpcomingCardProps {
  bills: ScheduledBill[];
  accounts: Account[];
  categories: Category[];
}

function formatDueLabel(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getBillAmounts(bill: ScheduledBill) {
  const target = parseFloat(bill.amount);
  const paid = bill.isPaid ? target : 0;
  const remaining = Math.max(0, target - paid);
  const paidPercent = target > 0 ? Math.min(100, (paid / target) * 100) : 0;

  return { target, paid, remaining, paidPercent };
}

function buildBillPrefill(
  bill: ScheduledBill,
  accounts: Account[],
  categories: Category[]
): TransactionPrefill {
  const { remaining } = getBillAmounts(bill);

  return {
    type: "expense",
    description: bill.title,
    amount: remaining > 0 ? remaining.toFixed(2) : "",
    categoryId: bill.categoryId ?? getDefaultCategoryId(categories, "expense"),
    date: getLocalDateString(),
    accountId: bill.accountId ?? accounts[0]?.id ?? "",
  };
}

interface BudgetMiniCardProps {
  bill: ScheduledBill;
  onClick: () => void;
}

function BudgetMiniCard({ bill, onClick }: BudgetMiniCardProps) {
  const { target, paid, remaining, paidPercent } = getBillAmounts(bill);
  const dueLabel = formatDueLabel(bill.dueDate);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col gap-2 rounded-lg bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-slate-800">{bill.title}</p>
        <span className="shrink-0 text-xs text-slate-400">Due {dueLabel}</span>
      </div>

      <p className="text-lg font-bold tabular-nums text-slate-900">
        {formatCurrency(remaining)}{" "}
        <span className="text-sm font-medium text-slate-500">left</span>
      </p>

      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${paidPercent}%`,
              backgroundColor: bill.categoryColor ?? "#38bdf8",
            }}
          />
        </div>
        <p className="text-xs tabular-nums text-slate-500">
          {formatCurrency(paid)} of {formatCurrency(target)} paid · Tap to pay
        </p>
      </div>
    </button>
  );
}

export function BudgetUpcomingCard({
  bills,
  accounts,
  categories,
}: BudgetUpcomingCardProps) {
  const router = useRouter();
  const [selectedBill, setSelectedBill] = useState<ScheduledBill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const transactionPrefill = useMemo(
    () =>
      selectedBill ? buildBillPrefill(selectedBill, accounts, categories) : undefined,
    [selectedBill, accounts, categories]
  );

  const selectedBillRemaining = selectedBill
    ? getBillAmounts(selectedBill).remaining
    : undefined;

  function handleBillClick(bill: ScheduledBill) {
    setSelectedBill(bill);
    setModalOpen(true);
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      setSelectedBill(null);
    }
  }

  function handleTransactionSaved() {
    setModalOpen(false);
    setSelectedBill(null);
    router.refresh();
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="p-5 pb-0">
          <h2 className="text-lg font-bold">Budget</h2>
        </div>
        <div className="p-5">
          {bills.length === 0 ? (
            <div
              className={cn(
                "flex h-[250px] items-center justify-center text-center text-sm text-slate-500"
              )}
            >
              No unpaid bills this month. You&apos;re all caught up.
            </div>
          ) : (
            <div className="grid max-h-[250px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
              {bills.map((bill) => (
                <BudgetMiniCard
                  key={bill.id}
                  bill={bill}
                  onClick={() => handleBillClick(bill)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTransactionModal
        accounts={accounts}
        categories={categories}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        prefill={transactionPrefill}
        scheduledBillId={selectedBill?.id}
        scheduledBillRemaining={selectedBillRemaining}
        onSuccess={handleTransactionSaved}
      />
    </>
  );
}
