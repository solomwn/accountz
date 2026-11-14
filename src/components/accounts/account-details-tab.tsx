"use client";

import type { AccountBalance } from "@/app/actions";
import { AccountActionButtons } from "@/components/accounts/account-action-buttons";
import { formatCurrency } from "@/lib/format";

interface AccountDetailsTabProps {
  account: AccountBalance;
  supportsAccountType: boolean;
}

export function AccountDetailsTab({
  account,
  supportsAccountType,
}: AccountDetailsTabProps) {
  return (
    <div className="flex-1 overflow-auto px-5 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{account.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{account.currency}</p>
        </div>
        <AccountActionButtons
          account={account}
          supportsAccountType={supportsAccountType}
        />
      </div>

      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Opening Balance
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
            {formatCurrency(parseFloat(account.openingBalance))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current Balance
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-[#268ddd]">
            {formatCurrency(account.currentBalance)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Alert Limit
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
            {formatCurrency(parseFloat(account.alertLimit))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Currency
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-800">
            {account.currency}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Notes
        </dt>
        <dd className="mt-2 text-sm leading-relaxed text-slate-600">
          {account.notes?.trim() ? account.notes : "No notes added for this account."}
        </dd>
      </div>
    </div>
  );
}
