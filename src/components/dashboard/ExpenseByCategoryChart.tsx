"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { ExpenseCategory } from "@/app/actions";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dataCardHeaderStackClass,
  dataCardTitleClass,
} from "@/lib/premium-data-card";
import { formatCurrency } from "@/lib/format";

interface ExpenseByCategoryChartProps {
  categories: ExpenseCategory[];
}

function ExpenseTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-500">{item.name}</p>
      <p className="text-sm font-semibold text-slate-900">
        {formatCurrency(item.value)}
      </p>
      <p className="text-xs text-slate-400">{item.payload.percentage}% of total</p>
    </div>
  );
}

export function ExpenseByCategoryChart({
  categories,
}: ExpenseByCategoryChartProps) {
  const chartData = categories.map((cat) => ({
    category: cat.category,
    amount: cat.amount,
    percentage: cat.percentage,
    fill: cat.color,
  }));

  const chartConfig = categories.reduce<ChartConfig>((config, cat) => {
    config[cat.category] = {
      label: cat.category,
      color: cat.color,
    };
    return config;
  }, {});

  return (
    <Card>
      <CardHeader className={dataCardHeaderStackClass}>
        <CardTitle className={dataCardTitleClass}>
          Expense By Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-slate-400">No expenses recorded yet.</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[220px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ExpenseTooltip />} />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={65}
                  outerRadius={95}
                  strokeWidth={2}
                  stroke="#fff"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-xs text-slate-600">
                    {cat.category}
                  </span>
                  <span className="ml-auto text-xs font-medium tabular-nums text-slate-800">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
