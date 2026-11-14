import {
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}

function KpiCard({ icon, label, value, valueClassName }: KpiCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          {icon}
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 tabular-nums",
          valueClassName
        )}
      >
        {value}
      </p>
    </Card>
  );
}

interface DashboardKpiRowProps {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  incomeVsBudgetPct: number;
  expensesVsBudgetPct: number;
}

export function DashboardKpiRow({
  totalIncome,
  totalExpenses,
  currentBalance,
  incomeVsBudgetPct,
  expensesVsBudgetPct,
}: DashboardKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <KpiCard
        icon={<Wallet className="h-4 w-4" />}
        label="Total Income"
        value={formatCurrency(totalIncome)}
        valueClassName="text-emerald-600"
      />
      <KpiCard
        icon={<ArrowDownRight className="h-4 w-4" />}
        label="Total Expenses"
        value={formatCurrency(totalExpenses)}
        valueClassName="text-rose-600"
      />
      <KpiCard
        icon={<Scale className="h-4 w-4" />}
        label="Current Balance"
        value={formatCurrency(currentBalance)}
        valueClassName="text-[#268ddd]"
      />
      <KpiCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Income vs Budget"
        value={`${incomeVsBudgetPct}%`}
        valueClassName={
          incomeVsBudgetPct >= 100 ? "text-emerald-600" : "text-slate-900"
        }
      />
      <KpiCard
        icon={<ArrowUpRight className="h-4 w-4" />}
        label="Expenses vs Budget"
        value={`${expensesVsBudgetPct}%`}
        valueClassName={
          expensesVsBudgetPct > 100 ? "text-rose-600" : "text-slate-900"
        }
      />
    </div>
  );
}
