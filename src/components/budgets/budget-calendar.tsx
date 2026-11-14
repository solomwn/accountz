"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getScheduledBillsForMonth,
  type Account,
  type Category,
  type ScheduledBill,
} from "@/app/actions";
import { CreateScheduledBillModal } from "@/components/budgets/create-scheduled-bill-modal";
import { EditScheduledBillModal } from "@/components/budgets/edit-scheduled-bill-modal";
import { ScheduledBillDetailModal } from "@/components/budgets/scheduled-bill-detail-modal";
import { Button } from "@/components/ui/button";
import { formatCurrency, toDateOnlyString } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MAX_VISIBLE_BILLS = 3;

function formatBillAmount(amount: string | number): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${value.toFixed(2)} €`;
}

interface BudgetCalendarProps {
  initialBills: ScheduledBill[];
  initialYear: number;
  initialMonth: number;
  categories: Category[];
  accounts: Account[];
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthTitle(year: number, month: number): string {
  const shortMonth = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "short",
  });
  return `${shortMonth}' ${year}`;
}

/**
 * Builds a fixed 6-week (42-cell) Monday-start calendar grid for the given month.
 * The first cell is the Monday on or before the 1st; trailing cells cover the
 * remainder of the final week (including days from adjacent months).
 */
export function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function groupBillsByDate(bills: ScheduledBill[]): Map<string, ScheduledBill[]> {
  const map = new Map<string, ScheduledBill[]>();

  for (const bill of bills) {
    const dateKey = toDateOnlyString(bill.dueDate);
    const existing = map.get(dateKey) ?? [];
    existing.push(bill);
    map.set(dateKey, existing);
  }

  for (const [key, dayBills] of map) {
    dayBills.sort((a, b) => a.title.localeCompare(b.title));
    map.set(key, dayBills);
  }

  return map;
}

export function BudgetCalendar({
  initialBills,
  initialYear,
  initialMonth,
  categories,
  accounts,
}: BudgetCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [bills, setBills] = useState(initialBills);
  const [selectedBill, setSelectedBill] = useState<ScheduledBill | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<ScheduledBill | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const todayKey = toDateKey(new Date());

  const calendarDays = useMemo(
    () => buildCalendarGrid(year, month),
    [year, month]
  );

  const billsByDate = useMemo(() => groupBillsByDate(bills), [bills]);

  const { totalPlanned, totalPaid, remaining } = useMemo(() => {
    let planned = 0;
    let paid = 0;

    for (const bill of bills) {
      const amount = parseFloat(bill.amount);
      planned += amount;
      if (bill.isPaid) {
        paid += amount;
      }
    }

    return {
      totalPlanned: planned,
      totalPaid: paid,
      remaining: planned - paid,
    };
  }, [bills]);

  function refreshBills() {
    startTransition(async () => {
      const nextBills = await getScheduledBillsForMonth(year, month + 1);
      setBills(nextBills);
    });
  }

  function loadMonth(nextYear: number, nextMonth: number) {
    startTransition(async () => {
      const nextBills = await getScheduledBillsForMonth(
        nextYear,
        nextMonth + 1
      );
      setYear(nextYear);
      setMonth(nextMonth);
      setBills(nextBills);
    });
  }

  function goToPreviousMonth() {
    if (month === 0) {
      loadMonth(year - 1, 11);
      return;
    }
    loadMonth(year, month - 1);
  }

  function goToNextMonth() {
    if (month === 11) {
      loadMonth(year + 1, 0);
      return;
    }
    loadMonth(year, month + 1);
  }

  function openBillDetail(bill: ScheduledBill) {
    setSelectedBill(bill);
    setDetailOpen(true);
  }

  function openBillEdit(bill: ScheduledBill) {
    setDetailOpen(false);
    setBillToEdit(bill);
    setEditOpen(true);
  }

  function handleBillUpdated() {
    setBillToEdit(null);
    refreshBills();
  }

  function handleBillDeleted(billId: string) {
    setBills((current) => current.filter((bill) => bill.id !== billId));
    setBillToEdit(null);
    setSelectedBill(null);
    refreshBills();
  }

  function handleBillPaid(billId: string) {
    setBills((current) =>
      current.map((bill) =>
        bill.id === billId ? { ...bill, isPaid: true } : bill
      )
    );
    setSelectedBill(null);
  }

  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {formatMonthTitle(year, month)}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Here are all your planned bills for the month. Click a bill to view
              details, edit, or mark it as paid.
            </p>
          </div>

          <CreateScheduledBillModal
            accounts={accounts}
            categories={categories}
            viewedYear={year}
            viewedMonth={month}
            onCreated={refreshBills}
            trigger={
              <Button variant="premium" className="w-full shrink-0 lg:w-auto">
                Add bill
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2.5 sm:gap-6 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Total Planned
          </p>
          <p className="text-sm font-bold tabular-nums text-slate-900">
            {formatCurrency(totalPlanned)}
          </p>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Total Paid
          </p>
          <p className="text-sm font-bold tabular-nums text-emerald-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Remaining
          </p>
          <p className="text-sm font-bold tabular-nums text-slate-900">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className={cn("px-6", isPending && "opacity-60")}>
        <div className="grid grid-cols-7 border-b border-slate-200">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={cn(
                "py-3 text-center text-xs font-bold tracking-wide",
                index === todayWeekdayIndex && year === new Date().getFullYear() && month === new Date().getMonth()
                  ? "text-red-500"
                  : "text-slate-400"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, dateKey, isCurrentMonth }) => {
            const dayBills = billsByDate.get(dateKey) ?? [];
            const visibleBills = dayBills.slice(0, MAX_VISIBLE_BILLS);
            const hiddenCount = dayBills.length - visibleBills.length;
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[9.5rem] border-b border-r border-slate-100 p-3",
                  isToday && "border-t-2 border-t-red-500 bg-[#faf8f5]",
                  !isToday && "border-t border-t-slate-100",
                  !isCurrentMonth && "bg-slate-50/60"
                )}
              >
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    isCurrentMonth ? "text-slate-900" : "text-slate-300"
                  )}
                >
                  {String(date.getDate()).padStart(2, "0")}
                </span>

                <div className="mt-2 flex flex-col gap-1.5">
                  {visibleBills.map((bill) => (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => openBillDetail(bill)}
                      className={cn(
                        "truncate rounded-md text-left text-xs font-medium transition-colors hover:bg-white/80",
                        bill.isPaid ? "text-green-600" : "text-slate-500"
                      )}
                    >
                      {bill.title} - {formatBillAmount(bill.amount)}
                    </button>
                  ))}

                  {hiddenCount > 0 ? (
                    <p className="text-xs font-medium text-slate-400">
                      And {hiddenCount} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <ScheduledBillDetailModal
      bill={selectedBill}
      accounts={accounts}
      open={detailOpen}
      onOpenChange={setDetailOpen}
      onPaid={handleBillPaid}
      onEdit={openBillEdit}
    />

    <EditScheduledBillModal
      bill={billToEdit}
      accounts={accounts}
      categories={categories}
      open={editOpen}
      onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setBillToEdit(null);
        }
      }}
      onUpdated={handleBillUpdated}
      onDeleted={handleBillDeleted}
    />
    </>
  );
}
