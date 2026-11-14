"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AccountBalance, Transaction } from "@/app/actions";
import { AccountActionButtons } from "@/components/accounts/account-action-buttons";
import { AccountDetailsTab } from "@/components/accounts/account-details-tab";
import { AccountTransactionsList } from "@/components/accounts/account-transactions-list";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "transactions", label: "Transactions" },
  { id: "statements", label: "Statements" },
  { id: "details", label: "Account Details" },
] as const;

type AccountTab = (typeof TABS)[number]["id"];

interface AccountDetailPanelProps {
  account: AccountBalance;
  transactions: Transaction[];
  supportsAccountType: boolean;
}

export function AccountDetailPanel({
  account,
  transactions,
  supportsAccountType,
}: AccountDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>("transactions");

  const accountTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.accountId === account.id ||
          transaction.toAccountId === account.id
      ),
    [transactions, account.id]
  );

  return (
    <section className="flex min-h-[420px] flex-1 flex-col bg-white lg:min-h-0">
      <div className="flex items-center justify-between border-b border-slate-200 pr-3">
        <nav className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-5 py-4 text-xs font-semibold uppercase tracking-wide transition-colors",
                activeTab === tab.id
                  ? "border-[#268ddd] text-[#268ddd]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <AccountActionButtons
          account={account}
          compact
          supportsAccountType={supportsAccountType}
        />
      </div>

      <div className="flex flex-1 flex-col">
        {activeTab === "transactions" ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-medium text-slate-500">
                Transaction Details
              </h2>
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <AccountTransactionsList
              account={account}
              transactions={accountTransactions}
            />
          </>
        ) : null}

        {activeTab === "statements" ? (
          <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Statements are not available yet
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Monthly account statements will appear here in a future update.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "details" ? (
          <AccountDetailsTab
            account={account}
            supportsAccountType={supportsAccountType}
          />
        ) : null}
      </div>
    </section>
  );
}
