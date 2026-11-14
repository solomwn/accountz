import type { LucideIcon } from "lucide-react";

interface TableEmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
}

export function TableEmptyState({
  icon: Icon,
  message,
  description,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
        <Icon className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
      {description ? (
        <p className="max-w-sm text-sm text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
