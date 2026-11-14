"use client";

import { useEffect, useState } from "react";
import type { AccountBalance, Transaction } from "@/app/actions";
import { AccountDetailPanel } from "@/components/accounts/account-detail-panel";
import { AccountSummarySidebar } from "@/components/accounts/account-summary-sidebar";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { Wallet } from "lucide-react";

interface AccountsPageClientProps {
  accounts: AccountBalance[];
  transactions: Transaction[];
  supportsAccountType: boolean;
}

export function AccountsPageClient({
  accounts,
  transactions,
  supportsAccountType,
}: AccountsPageClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id ?? null
  );

  useEffect(() => {
    if (
      accounts.length > 0 &&
      (!selectedAccountId ||
        !accounts.some((account) => account.id === selectedAccountId))
    ) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex min-h-[calc(100vh-11rem)] flex-col lg:grid lg:grid-cols-3">
        <AccountSummarySidebar
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
        />

        <div className="flex min-h-[420px] flex-col lg:col-span-2">
          {selectedAccount ? (
            <AccountDetailPanel
              key={selectedAccount.id}
              account={selectedAccount}
              transactions={transactions}
              supportsAccountType={supportsAccountType}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-white p-6">
              <TableEmptyState
                icon={Wallet}
                message="Select an account to view details."
                description="Choose an account from the summary list, or create a new one."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
