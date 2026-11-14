import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  income: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-700",
  transfer: "bg-blue-50 text-blue-700",
  bank: "bg-blue-50 text-blue-700",
  cash: "bg-amber-50 text-amber-700",
  credit: "bg-violet-50 text-violet-700",
};

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const key = type.toLowerCase();
  const colorClass = TYPE_STYLES[key] ?? "bg-slate-50 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {type}
    </span>
  );
}
