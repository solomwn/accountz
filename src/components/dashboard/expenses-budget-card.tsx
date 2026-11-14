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

interface ExpensesBudgetCardProps {
  spentThisMonth: number;
  monthlyBudget: number;
  accounts: Account[];
  categories: Category[];
}

export function ExpensesBudgetCard({
  spentThisMonth,
  monthlyBudget,
  accounts,
  categories,
}: ExpensesBudgetCardProps) {
  const remaining = monthlyBudget - spentThisMonth;
  const progress =
    monthlyBudget > 0
      ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100))
      : 0;

  return (
    <Card>
      <CardHeader className={dataCardHeaderClass}>
        <CardTitle className={dataCardTitleClass}>Monthly Expenses</CardTitle>
        <CreateTransactionModal
          accounts={accounts}
          categories={categories}
          defaultType="expense"
          trigger={
            <Button
              size="sm"
              className="h-8 text-xs"
              variant="premium"
            >
              + Add Expense
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {formatCurrency(spentThisMonth)} of{" "}
              {formatCurrency(monthlyBudget)}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-slate-100 [&>div]:bg-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Spent
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-600">
              {formatCurrency(spentThisMonth)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Remaining Budget
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
