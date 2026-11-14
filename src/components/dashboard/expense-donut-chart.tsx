"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEuro } from "@/lib/format";
import type { ExpenseCategory } from "@/app/actions";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(0, 72%, 51%)",
];

interface ExpenseDonutChartProps {
  categories: ExpenseCategory[];
}

export function ExpenseDonutChart({ categories }: ExpenseDonutChartProps) {
  const topCategories = categories.slice(0, 4);
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);

  const chartData = topCategories.map((cat, index) => ({
    category: cat.category,
    amount: cat.amount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartConfig = topCategories.reduce<ChartConfig>((config, cat, index) => {
    config[cat.category] = {
      label: cat.category,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return config;
  }, {});

  if (categories.length === 0) {
    return (
      <Card className="h-full border-0 bg-white shadow-md shadow-slate-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            Gastos por categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-slate-400">No hay gastos registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 bg-white shadow-md shadow-slate-200/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          Gastos por categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[200px] w-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="category"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={2}
                stroke="white"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-slate-900 text-lg font-semibold"
                          >
                            {formatEuro(totalExpenses)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-slate-400 text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="flex flex-1 flex-col gap-4">
            {topCategories.map((cat, index) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <div className="flex flex-1 items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-3 text-sm tabular-nums">
                    <span className="text-slate-500">{cat.percentage}%</span>
                    <span className="font-medium text-slate-900">
                      {formatEuro(cat.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
