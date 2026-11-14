"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
  Wallet,
} from "lucide-react";
import type {
  Account,
  CashFlowChartPoint,
  Category,
  GroupTransaction,
  ScheduledBill,
  SpendingByGroup,
} from "@/app/actions";
import { getTransactionsForGroupThisMonth } from "@/app/actions";
import { BudgetUpcomingCard } from "@/components/dashboard/budget-upcoming-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { SpendingGroupTransactionsModal } from "@/components/dashboard/spending-group-transactions-modal";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
const SEGMENT_COUNT = 32;

type TrendMode = "standard" | "expense";

interface SpendingByGroupRowProps {
  name: string;
  spent: number;
  target: number;
  maxAmount: number;
  color: string;
  onClick: () => void;
}

function SpendingByGroupRow({
  name,
  spent,
  target,
  maxAmount,
  color,
  onClick,
}: SpendingByGroupRowProps) {
  const displayAmount = Math.max(target, spent);
  const fillWidthPercent =
    displayAmount > 0 ? Math.min(100, (spent / displayAmount) * 100) : 0;
  const trackWidthPercent = (displayAmount / maxAmount) * 100;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <span className="truncate font-bold text-slate-900">{name}</span>
        <span className="shrink-0 font-bold tabular-nums text-slate-900">
          {formatCurrency(displayAmount)}
        </span>
      </div>

      <div className="h-2 w-full">
        <div
          className="h-full overflow-hidden rounded-full bg-gray-200"
          style={{ width: `${trackWidthPercent}%` }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: color || "#9ca3af",
              width: `${fillWidthPercent}%`,
            }}
          />
        </div>
      </div>
    </button>
  );
}

function getTrendDisplay(
  percent: number | null,
  mode: TrendMode = "standard"
): { text: string; className: string } {
  if (percent === null) {
    return {
      text: "No prior month data",
      className: "text-slate-400",
    };
  }

  if (percent === 0) {
    return {
      text: "0.0% vs last month",
      className: "text-slate-500",
    };
  }

  const sign = percent > 0 ? "+" : "";

  if (mode === "expense") {
    return {
      text: `${sign}${percent.toFixed(2)}% vs last month`,
      className: percent > 0 ? "text-rose-500" : "text-emerald-500",
    };
  }

  return {
    text: `${sign}${percent.toFixed(2)}% vs last month`,
    className: percent > 0 ? "text-emerald-600" : "text-rose-500",
  };
}

interface SegmentedProgressBarProps {
  fillPercent: number;
  activeClassName: string;
}

function SegmentedProgressBar({
  fillPercent,
  activeClassName,
}: SegmentedProgressBarProps) {
  const filledSegments = Math.round((fillPercent / 100) * SEGMENT_COUNT);

  return (
    <div className="flex items-end gap-[2px]">
      {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
        <div
          key={index}
          className={cn(
            "h-5 w-[3px] rounded-full transition-colors",
            index < filledSegments ? activeClassName : "bg-slate-100"
          )}
        />
      ))}
    </div>
  );
}

interface DashboardSummaryCardProps {
  icon: React.ReactNode;
  iconClassName: string;
  iconBgClassName: string;
  title: string;
  value: string;
  subtitle: string;
  subtitleClassName: string;
  barFillPercent: number;
  barClassName: string;
  href?: string;
}

function DashboardSummaryCard({
  icon,
  iconClassName,
  iconBgClassName,
  title,
  value,
  subtitle,
  subtitleClassName,
  barFillPercent,
  barClassName,
  href,
}: DashboardSummaryCardProps) {
  const cardClassName = cn(
    "flex flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm",
    href && "cursor-pointer transition-shadow hover:shadow-md"
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              iconBgClassName
            )}
          >
            <div className={iconClassName}>{icon}</div>
          </div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>

      <p className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>

      <p className={cn("mt-1 text-xs font-medium", subtitleClassName)}>
        {subtitle}
      </p>

      <div className="mt-3">
        <SegmentedProgressBar
          fillPercent={barFillPercent}
          activeClassName={barClassName}
        />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

export interface DashboardProps {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  incomeTrend: number | null;
  expenseTrend: number | null;
  savingsTrend: number | null;
  incomeBarFill: number;
  expenseBarFill: number;
  savingsBarFill: number;
  budgetPlanned: number;
  budgetPaid: number;
  budgetRemaining: number;
  budgetBarFill: number;
  upcomingBills: ScheduledBill[];
  accounts: Account[];
  categories: Category[];
  cashFlowData: CashFlowChartPoint[];
  spendingByGroupData: SpendingByGroup[];
}

export function Dashboard({
  totalIncome,
  totalExpenses,
  netSavings,
  incomeTrend,
  expenseTrend,
  savingsTrend,
  incomeBarFill,
  expenseBarFill,
  savingsBarFill,
  budgetPlanned,
  budgetPaid,
  budgetRemaining,
  budgetBarFill,
  upcomingBills,
  accounts,
  categories,
  cashFlowData,
  spendingByGroupData,
}: DashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<SpendingByGroup | null>(null);
  const [groupTransactions, setGroupTransactions] = useState<GroupTransaction[]>([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [loadingGroupTransactions, setLoadingGroupTransactions] = useState(false);

  const incomeTrendDisplay = getTrendDisplay(incomeTrend);
  const expenseTrendDisplay = getTrendDisplay(expenseTrend, "expense");
  const savingsTrendDisplay = getTrendDisplay(savingsTrend);

  const budgetSubtitle = `${formatCurrency(budgetPaid)} spent • ${formatCurrency(budgetRemaining)} remaining`;

  const { sortedSpendingByGroup, maxAmount } = useMemo(() => {
    const sorted = [...spendingByGroupData]
      .filter((entry) => entry.name.trim().length > 0)
      .sort((a, b) => {
        const amountA = Math.max(a.target, a.value);
        const amountB = Math.max(b.target, b.value);
        return amountB - amountA;
      });

    const maxAmount = Math.max(
      1,
      ...sorted.map((entry) => Math.max(entry.target, entry.value))
    );

    return { sortedSpendingByGroup: sorted, maxAmount };
  }, [spendingByGroupData]);

  async function handleGroupClick(group: SpendingByGroup) {
    setSelectedGroup(group);
    setGroupModalOpen(true);
    setLoadingGroupTransactions(true);
    setGroupTransactions([]);

    try {
      const transactions = await getTransactionsForGroupThisMonth(group.name);
      setGroupTransactions(transactions);
    } catch (error) {
      console.error(error);
      setGroupTransactions([]);
    } finally {
      setLoadingGroupTransactions(false);
    }
  }

  function handleGroupModalOpenChange(open: boolean) {
    setGroupModalOpen(open);
    if (!open) {
      setSelectedGroup(null);
      setGroupTransactions([]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <DashboardSummaryCard
          icon={<Wallet className="h-4 w-4" />}
          iconClassName="text-sky-500"
          iconBgClassName="bg-sky-50"
          title="Total Income"
          value={formatCurrency(totalIncome)}
          subtitle={incomeTrendDisplay.text}
          subtitleClassName={incomeTrendDisplay.className}
          barFillPercent={incomeBarFill}
          barClassName="bg-sky-400"
        />
        <DashboardSummaryCard
          icon={<ArrowDownRight className="h-4 w-4" />}
          iconClassName="text-orange-500"
          iconBgClassName="bg-orange-50"
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={expenseTrendDisplay.text}
          subtitleClassName={expenseTrendDisplay.className}
          barFillPercent={expenseBarFill}
          barClassName="bg-orange-500"
        />
        <DashboardSummaryCard
          icon={<PiggyBank className="h-4 w-4" />}
          iconClassName="text-blue-600"
          iconBgClassName="bg-blue-50"
          title="Net Savings"
          value={formatCurrency(netSavings)}
          subtitle={savingsTrendDisplay.text}
          subtitleClassName={savingsTrendDisplay.className}
          barFillPercent={savingsBarFill}
          barClassName="bg-blue-600"
        />
        <DashboardSummaryCard
          href="/budgets"
          icon={<Target className="h-4 w-4" />}
          iconClassName="text-purple-500"
          iconBgClassName="bg-purple-50"
          title="Budgets"
          value={formatCurrency(budgetPlanned)}
          subtitle={budgetSubtitle}
          subtitleClassName="text-slate-500"
          barFillPercent={budgetBarFill}
          barClassName="bg-purple-500"
        />
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="p-5 pb-0">
          <h2 className="text-lg font-bold">Cash Flow</h2>
        </div>
        <div className="p-5 pt-0">
          <CashFlowChart data={cashFlowData} />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold">Spending by Group</h2>
          </div>
          <div className="p-5">
            {spendingByGroupData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">
                No expense data for this month yet.
              </div>
            ) : (
              <div className="flex max-h-[250px] flex-col gap-4 overflow-y-auto pr-1">
                {sortedSpendingByGroup.map((entry) => (
                  <SpendingByGroupRow
                    key={entry.name}
                    name={entry.name}
                    spent={entry.value}
                    target={entry.target}
                    maxAmount={maxAmount}
                    color={entry.color}
                    onClick={() => handleGroupClick(entry)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <BudgetUpcomingCard
          bills={upcomingBills}
          accounts={accounts}
          categories={categories}
        />
      </div>

      <SpendingGroupTransactionsModal
        groupName={selectedGroup?.name ?? null}
        transactions={groupTransactions}
        loading={loadingGroupTransactions}
        open={groupModalOpen}
        onOpenChange={handleGroupModalOpenChange}
      />
    </div>
  );
}
