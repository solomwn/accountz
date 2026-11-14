"use client";

import { CreditCard, Wallet } from "lucide-react";
import type { AccountBalance } from "@/app/actions";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatAccountRef(id: string): string {
  return id.replace(/-/g, "").slice(-12).toUpperCase();
}

interface AccountSummaryCardProps {
  account: AccountBalance;
  selected: boolean;
  onSelect: () => void;
}

function AccountSummaryCard({
  account,
  selected,
  onSelect,
}: AccountSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-[#268ddd] bg-white shadow-sm ring-1 ring-[#268ddd]/15"
          : "border-transparent bg-slate-100/70 hover:border-slate-200 hover:bg-white"
      )}
    >
      {selected ? (
        <span
          className="absolute right-3 top-3 text-[#268ddd]"
          aria-hidden="true"
        >
          *
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-4 pr-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {account.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatAccountRef(account.id)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-xl font-bold tabular-nums leading-tight",
              account.currentBalance >= 0 ? "text-slate-900" : "text-rose-600"
            )}
          >
            {formatCurrency(account.currentBalance)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
            Current Balance
          </p>
        </div>
      </div>
    </button>
  );
}

interface AccountSummarySidebarProps {
  accounts: AccountBalance[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
}

export function AccountSummarySidebar({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: AccountSummarySidebarProps) {
  return (
    <aside className="flex flex-col border-b border-slate-200 bg-slate-50 lg:col-span-1 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <CreditCard className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-medium text-slate-500">Account Summary</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {accounts.length === 0 ? (
          <TableEmptyState
            icon={Wallet}
            message="No accounts recorded yet."
            description="Create an account to start tracking balances."
          />
        ) : (
          accounts.map((account) => (
            <AccountSummaryCard
              key={account.id}
              account={account}
              selected={account.id === selectedAccountId}
              onSelect={() => onSelectAccount(account.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
