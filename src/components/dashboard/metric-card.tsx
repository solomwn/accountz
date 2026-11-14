import { Filter, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  valueClassName?: string;
}

export function MetricCard({ title, value, valueClassName }: MetricCardProps) {
  return (
    <Card className="border-0 bg-white shadow-md shadow-slate-200/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
            aria-label="Filter"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            valueClassName
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
