import { Landmark } from "lucide-react";
import type { AccountBalance } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface AccountBalanceCardsProps {
  accounts: AccountBalance[];
}

export function AccountBalanceCards({ accounts }: AccountBalanceCardsProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {accounts.map((account) => (
        <Card
          key={account.id}
          className="min-w-[160px] shrink-0"
        >
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">
                {account.name}
              </p>
              <p
                className={`text-lg font-semibold tracking-tight tabular-nums ${
                  account.currentBalance >= 0
                    ? "text-slate-900"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(account.currentBalance)}
              </p>
              <p className="text-[10px] text-slate-400">{account.currency}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
