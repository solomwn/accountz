import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { ScheduledBill } from "@/app/actions";

interface BillReminderBannerProps {
  bills: ScheduledBill[];
}

export function BillReminderBanner({ bills }: BillReminderBannerProps) {
  if (bills.length === 0) {
    return null;
  }

  const titles = bills.map((bill) => bill.title).join(", ");

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <CalendarDays className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          Reminder: {bills.length} bill{bills.length === 1 ? "" : "s"} due soon (
          {titles})
        </p>
      </div>
      <Link
        href="/budgets"
        className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
      >
        View Agenda
      </Link>
    </div>
  );
}
