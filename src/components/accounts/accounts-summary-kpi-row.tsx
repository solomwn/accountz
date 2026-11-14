import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Wallet,
} from "lucide-react";
import type { AccountBalance } from "@/app/actions";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  valueClassName?: string;
}

function KpiCard({ icon, label, value, subtitle, valueClassName }: KpiCardProps) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
            {icon}
          </div>
        </div>
        <p
          className={cn(
            "text-xl font-semibold leading-tight tracking-tight text-slate-900 tabular-nums",
            valueClassName
          )}
        >
          {value}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </Card>
  );
}

interface AccountsSummaryKpiRowProps {
  accounts: AccountBalance[];
}

function getExtremeAccounts(accounts: AccountBalance[]) {
  if (accounts.length === 0) {
    return { lowest: null, highest: null };
  }

  return accounts.reduce(
    (extremes, account) => ({
      lowest:
        !extremes.lowest ||
        account.currentBalance < extremes.lowest.currentBalance
          ? account
          : extremes.lowest,
      highest:
        !extremes.highest ||
        account.currentBalance > extremes.highest.currentBalance
          ? account
          : extremes.highest,
    }),
    { lowest: null as AccountBalance | null, highest: null as AccountBalance | null }
  );
}

export function AccountsSummaryKpiRow({ accounts }: AccountsSummaryKpiRowProps) {
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0
  );
  const { lowest, highest } = getExtremeAccounts(accounts);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<Wallet className="h-3.5 w-3.5" />}
        label="Total Balance"
        value={formatCurrency(totalBalance)}
        valueClassName="text-[#268ddd]"
      />
      <KpiCard
        icon={<Landmark className="h-3.5 w-3.5" />}
        label="Accounts"
        value={String(accounts.length)}
      />
      <KpiCard
        icon={<ArrowDownRight className="h-3.5 w-3.5" />}
        label="Lowest Balance"
        value={lowest ? formatCurrency(lowest.currentBalance) : "—"}
        subtitle={lowest?.name}
        valueClassName={
          lowest && lowest.currentBalance < 0 ? "text-rose-600" : undefined
        }
      />
      <KpiCard
        icon={<ArrowUpRight className="h-3.5 w-3.5" />}
        label="Highest Balance"
        value={highest ? formatCurrency(highest.currentBalance) : "—"}
        subtitle={highest?.name}
        valueClassName="text-emerald-600"
      />
    </div>
  );
}
