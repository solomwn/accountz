"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import type { IncomeCategory } from "@/app/actions";
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
import { formatCurrency, formatCurrencyAxis } from "@/lib/format";

interface IncomeByCategoryChartProps {
  categories: IncomeCategory[];
}

function IncomeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function IncomeByCategoryChart({
  categories,
}: IncomeByCategoryChartProps) {
  const chartData = categories.map((cat) => ({
    category: cat.category,
    amount: cat.amount,
    fill: cat.color,
  }));

  const chartConfig = categories.reduce<ChartConfig>(
    (config, cat) => {
      config[cat.category] = {
        label: cat.category,
        color: cat.color,
      };
      return config;
    },
    { amount: { label: "Amount", color: "#6366f1" } }
  );

  return (
    <Card>
      <CardHeader className={dataCardHeaderStackClass}>
        <CardTitle className={dataCardTitleClass}>
          Income By Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-slate-400">No income recorded yet.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(value) => formatCurrencyAxis(value)}
                width={45}
              />
              <ChartTooltip content={<IncomeTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
