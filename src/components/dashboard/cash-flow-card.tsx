"use client";

import { Area, AreaChart, XAxis, YAxis } from "recharts";
import type { MonthlyCashFlow } from "@/app/actions";
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

const chartConfig = {
  income: {
    label: "Income",
    color: "#6366f1",
  },
  expense: {
    label: "Expenses",
    color: "#a78bfa",
  },
} satisfies ChartConfig;

interface CashFlowTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CashFlowTooltip({ active, payload, label }: CashFlowTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 capitalize">{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface CashFlowCardProps {
  monthlyCashFlow: MonthlyCashFlow[];
}

export function CashFlowCard({ monthlyCashFlow }: CashFlowCardProps) {
  return (
    <Card>
      <CardHeader className={dataCardHeaderStackClass}>
        <CardTitle className={dataCardTitleClass}>Cash Flow Trend</CardTitle>
        <p className="mt-1 text-xs text-slate-400">12-month income vs expenses</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={monthlyCashFlow}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(value) => formatCurrencyAxis(value)}
              width={45}
            />
            <ChartTooltip content={<CashFlowTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-slate-500">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
            <span className="text-xs text-slate-500">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
