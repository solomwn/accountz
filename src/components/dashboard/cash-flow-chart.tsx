"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { CashFlowChartPoint } from "@/app/actions";
import { formatCurrency } from "@/lib/format";

const INFLOW_FILL = "#7dd3fc";
const INFLOW_STROKE = "#0ea5e9";
const OUTFLOW_FILL = "#fdba74";
const OUTFLOW_STROKE = "#f97316";
const BAR_SIZE = 36;

interface CashFlowChartProps {
  data: CashFlowChartPoint[];
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  fillOpacity?: number;
}

function RoundedCashFlowBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = INFLOW_FILL,
  stroke = INFLOW_STROKE,
  fillOpacity = 0.7,
}: BarShapeProps) {
  const barHeight = Math.abs(height);
  if (barHeight < 1 || width < 1) {
    return null;
  }

  const rectY = height < 0 ? y + height : y;

  return (
    <rect
      x={x}
      y={rectY}
      width={width}
      height={barHeight}
      rx={10}
      ry={10}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
      fillOpacity={fillOpacity}
    />
  );
}

interface BarLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number | string;
}

function InflowBarLabel({ x = 0, y = 0, width = 0, value }: BarLabelProps) {
  const amount = Number(value);
  if (!amount) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y}
      dy={-6}
      textAnchor="middle"
      fontWeight="bold"
      className="fill-gray-500 text-[10px] font-bold"
    >
      {formatCurrency(amount)}
    </text>
  );
}

function OutflowBarLabel({
  x = 0,
  y = 0,
  width = 0,
  value,
}: BarLabelProps) {
  const amount = Math.abs(Number(value));
  if (!amount) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y}
      dy={6}
      dominantBaseline="hanging"
      textAnchor="middle"
      fontWeight="bold"
      className="fill-gray-500 text-[10px] font-bold"
    >
      {formatCurrency(amount)}
    </text>
  );
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const yDomain = useMemo(() => {
    const maxInflow = Math.max(...data.map((point) => point.inflow), 0);
    const maxOutflow = Math.max(
      ...data.map((point) => Math.abs(point.outflow)),
      0
    );
    const maxValue = Math.max(maxInflow, maxOutflow, 1);
    const paddedMax = maxValue * 1.15;

    return [-paddedMax, paddedMax] as [number, number];
  }, [data]);

  return (
    <div className="relative h-[300px] w-full">
      <span className="pointer-events-none absolute left-10 top-3 z-10 text-[10px] font-semibold tracking-wider text-slate-400">
        INFLOW
      </span>
      <span className="pointer-events-none absolute bottom-6 left-10 z-10 text-[10px] font-semibold tracking-wider text-slate-400">
        OUTFLOW
      </span>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
          barGap={-BAR_SIZE}
          barCategoryGap="18%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            vertical
            stroke="#e2e8f0"
          />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
            dy={4}
          />
          <YAxis
            width={44}
            axisLine={false}
            tickLine={false}
            ticks={[0]}
            domain={yDomain}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(value) => (value === 0 ? "$0" : "")}
          />
          <Bar
            dataKey="inflow"
            barSize={BAR_SIZE}
            shape={(props: BarShapeProps) => (
              <RoundedCashFlowBar
                {...props}
                fill={INFLOW_FILL}
                stroke={INFLOW_STROKE}
                fillOpacity={0.7}
              />
            )}
          >
            <LabelList dataKey="inflow" position="top" content={<InflowBarLabel />} />
          </Bar>
          <Bar
            dataKey="outflow"
            barSize={BAR_SIZE}
            shape={(props: BarShapeProps) => (
              <RoundedCashFlowBar
                {...props}
                fill={OUTFLOW_FILL}
                stroke={OUTFLOW_STROKE}
                fillOpacity={0.7}
              />
            )}
          >
            <LabelList dataKey="outflow" position="bottom" content={<OutflowBarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
