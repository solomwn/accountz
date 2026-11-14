"use client";

import { CreateTransactionModal } from "@/components/transactions/CreateTransactionModal";
import type { Account, Category } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dataCardHeaderClass,
  dataCardTitleClass,
} from "@/lib/premium-data-card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";

interface IncomeBudgetCardProps {
  earnedThisMonth: number;
  monthlyTarget: number;
  accounts: Account[];
  categories: Category[];
}

export function IncomeBudgetCard({
  earnedThisMonth,
  monthlyTarget,
  accounts,
  categories,
}: IncomeBudgetCardProps) {
  const progress =
    monthlyTarget > 0
      ? Math.min(100, Math.round((earnedThisMonth / monthlyTarget) * 100))
      : 0;

  return (
    <Card>
      <CardHeader className={dataCardHeaderClass}>
        <CardTitle className={dataCardTitleClass}>Income vs Budget</CardTitle>
        <CreateTransactionModal
          accounts={accounts}
          categories={categories}
          defaultType="income"
          trigger={
            <Button
              size="sm"
              className="h-8 text-xs"
              variant="premium"
            >
              + New Income
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {formatCurrency(earnedThisMonth)} of{" "}
              {formatCurrency(monthlyTarget)}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-slate-100 [&>div]:bg-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Earned This Month
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">
              {formatCurrency(earnedThisMonth)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Monthly Target
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">
              {formatCurrency(monthlyTarget)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
