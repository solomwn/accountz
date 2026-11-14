"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportData, YearlyMatrixData } from "@/app/actions";
import {
  YearlyMatrix,
  type YearlyMatrixGrouping,
} from "@/components/reports/yearly-matrix";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatCurrencyAxis } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";
const DEBT_PAYMENT_COLOR = "#6366f1";

type ReportView = "monthly" | "yearly-group" | "yearly-category";

interface ReportsViewProps {
  data: ReportData | null;
  yearlyMatrixData: YearlyMatrixData | null;
  view: ReportView;
  month: number;
  year: number;
}

function isYearlyMatrixView(view: ReportView): view is
  | "yearly-group"
  | "yearly-category" {
  return view === "yearly-group" || view === "yearly-category";
}

function ChartTooltipCard({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-md">
      {label ? (
        <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      ) : null}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { categoryName: string };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-500">{item.name}</p>
      <p className="text-sm font-semibold text-slate-900">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ReportView;
  onChange: (view: ReportView) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {(
        [
          { id: "monthly" as const, label: "Monthly Overview" },
          { id: "yearly-group" as const, label: "Monthly by Group" },
          { id: "yearly-category" as const, label: "Monthly by Category" },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === option.id
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ReportsView({
  data,
  yearlyMatrixData,
  view,
  month,
  year,
}: ReportsViewProps) {
  const router = useRouter();
  const periodLabel = isYearlyMatrixView(view)
    ? String(year)
    : `${MONTH_NAMES[month - 1]} ${year}`;
  const matrixGrouping: YearlyMatrixGrouping =
    view === "yearly-category" ? "category" : "group";

  const pieData =
    data?.expensesByCategory.map((item) => ({
      name: item.categoryName,
      value: item.amount,
      fill: item.color,
      categoryName: item.categoryName,
    })) ?? [];

  function navigate(next: { month?: number; year?: number; view?: ReportView }) {
    const params = new URLSearchParams();
    params.set("month", String(next.month ?? month));
    params.set("year", String(next.year ?? year));
    params.set("view", next.view ?? view);
    router.push(`/reports?${params.toString()}`);
  }

  function goToPreviousPeriod() {
    if (isYearlyMatrixView(view)) {
      navigate({ year: year - 1 });
      return;
    }

    if (month === 1) {
      navigate({ month: 12, year: year - 1 });
      return;
    }
    navigate({ month: month - 1 });
  }

  function goToNextPeriod() {
    if (isYearlyMatrixView(view)) {
      navigate({ year: year + 1 });
      return;
    }

    if (month === 12) {
      navigate({ month: 1, year: year + 1 });
      return;
    }
    navigate({ month: month + 1 });
  }

  function setView(nextView: ReportView) {
    navigate({ view: nextView });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isYearlyMatrixView(view)
                ? view === "yearly-category"
                  ? "Monthly expense breakdown by category for the selected year."
                  : "Monthly expense breakdown by group for the selected year."
                : data?.supportsDebtPaymentReporting
                  ? "Income, expenses, loan principal paid, and cash flow for the selected period."
                  : "Income, expenses, and cash flow for the selected period."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goToPreviousPeriod}
              aria-label={isYearlyMatrixView(view) ? "Previous year" : "Previous month"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[9rem] text-center text-sm font-medium text-slate-800">
              {periodLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goToNextPeriod}
              aria-label={isYearlyMatrixView(view) ? "Next year" : "Next month"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ViewToggle view={view} onChange={setView} />
      </div>

      {isYearlyMatrixView(view) ? (
        yearlyMatrixData ? (
          <YearlyMatrix data={yearlyMatrixData} grouping={matrixGrouping} />
        ) : null
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              label="Total Income"
              value={formatCurrency(data.totalIncome)}
              valueClassName="text-emerald-600"
            />
            <KpiCard
              label="Total Expenses"
              value={formatCurrency(data.totalExpense)}
              valueClassName="text-rose-600"
            />
            <KpiCard
              label="Net Balance"
              value={formatCurrency(data.netSavings)}
              valueClassName={
                data.netSavings >= 0 ? "text-blue-600" : "text-slate-700"
              }
            />
          </div>

          {data.supportsDebtPaymentReporting ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Loan Principal Paid
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Transfers to loan accounts — not counted as expenses
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-indigo-600">
                  {formatCurrency(data.totalDebtPayments)}
                </p>
              </div>

              {data.debtPaymentsByAccount.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {data.debtPaymentsByAccount.map((item) => (
                    <div
                      key={item.accountName}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-slate-600">{item.accountName}</span>
                      <span className="font-medium tabular-nums text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-400">
                  No loan principal payments recorded for this month.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Expenses by Category
              </h2>
              <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>

              {pieData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                  No expenses recorded for this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Tooltip content={<PieTooltip />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={105}
                      strokeWidth={2}
                      stroke="#fff"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Cash Flow
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {data.supportsDebtPaymentReporting
                  ? "Weekly income, expenses, and loan principal paid"
                  : "Weekly income vs expenses"}
              </p>

              {data.cashFlow.every((point) =>
                data.supportsDebtPaymentReporting
                  ? point.income === 0 &&
                    point.expense === 0 &&
                    point.debtPayments === 0
                  : point.income === 0 && point.expense === 0
              ) ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                  No transactions recorded for this month.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={data.cashFlow}
                      margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                      barGap={4}
                      barCategoryGap="20%"
                    >
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickFormatter={(value) => formatCurrencyAxis(value)}
                        width={48}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => (
                          <ChartTooltipCard
                            active={active}
                            label={label}
                            payload={payload?.map((entry) => ({
                              name:
                                entry.name === "income"
                                  ? "Income"
                                  : entry.name === "expense"
                                    ? "Expenses"
                                    : "Loan Principal",
                              value: Number(entry.value),
                              color:
                                entry.name === "income"
                                  ? INCOME_COLOR
                                  : entry.name === "expense"
                                    ? EXPENSE_COLOR
                                    : DEBT_PAYMENT_COLOR,
                            }))}
                          />
                        )}
                      />
                      <Bar
                        dataKey="income"
                        name="income"
                        fill={INCOME_COLOR}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="expense"
                        name="expense"
                        fill={EXPENSE_COLOR}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      {data.supportsDebtPaymentReporting ? (
                        <Bar
                          dataKey="debtPayments"
                          name="debtPayments"
                          fill={DEBT_PAYMENT_COLOR}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      ) : null}
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-4 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: INCOME_COLOR }}
                      />
                      <span className="text-xs text-slate-500">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: EXPENSE_COLOR }}
                      />
                      <span className="text-xs text-slate-500">Expenses</span>
                    </div>
                    {data.supportsDebtPaymentReporting ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: DEBT_PAYMENT_COLOR }}
                        />
                        <span className="text-xs text-slate-500">
                          Loan Principal
                        </span>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
