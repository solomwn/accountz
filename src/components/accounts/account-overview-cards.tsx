"use client";

import { Landmark, Wallet } from "lucide-react";
import type { AccountBalance } from "@/app/actions";
import { AccountActionButtons } from "@/components/accounts/account-action-buttons";
import { Card } from "@/components/ui/card";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function isBelowAlert(account: AccountBalance): boolean {
  return account.currentBalance < parseFloat(account.alertLimit);
}

function AccountStatusPill({ account }: { account: AccountBalance }) {
  const belowAlert = isBelowAlert(account);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        belowAlert
          ? "bg-rose-50 text-rose-700"
          : "bg-emerald-50 text-emerald-700"
      )}
    >
      {belowAlert ? "Below alert" : "OK"}
    </span>
  );
}

interface AccountOverviewCardProps {
  account: AccountBalance;
}

function AccountOverviewCard({ account }: AccountOverviewCardProps) {
  return (
    <Card className="px-4 py-3 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-1">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
              <Landmark className="h-3.5 w-3.5" />
            </div>
            <p className="truncate text-sm font-semibold text-slate-800">
              {account.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <AccountStatusPill account={account} />
            <AccountActionButtons account={account} compact />
          </div>
        </div>

        <div
          className={cn(
            "mt-1 text-xl font-bold tabular-nums",
            account.currentBalance >= 0 ? "text-slate-900" : "text-rose-600"
          )}
        >
          {formatCurrency(account.currentBalance)}
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{account.currency}</span>
          <span className="tabular-nums">
            Alert: {formatCurrency(parseFloat(account.alertLimit))}
          </span>
        </div>
      </div>
    </Card>
  );
}

interface AccountOverviewCardsProps {
  accounts: AccountBalance[];
}

export function AccountOverviewCards({ accounts }: AccountOverviewCardsProps) {
  if (accounts.length === 0) {
    return (
      <Card className="p-4">
        <TableEmptyState
          icon={Wallet}
          message="No accounts recorded yet."
          description="Add checking, savings, or cash wallets to track balances separately."
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {accounts.map((account) => (
        <AccountOverviewCard key={account.id} account={account} />
      ))}
    </div>
  );
}
