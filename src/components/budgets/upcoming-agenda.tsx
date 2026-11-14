"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  getScheduledBillsForMonth,
  payScheduledBill,
  type Account,
  type Category,
  type ScheduledBill,
} from "@/app/actions";
import { CreateScheduledBillModal } from "@/components/budgets/create-scheduled-bill-modal";
import { EditScheduledBillModal } from "@/components/budgets/edit-scheduled-bill-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDisplayDate, toDateOnlyString } from "@/lib/format";
import { premiumNativeSelectClass } from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface UpcomingAgendaProps {
  initialBills: ScheduledBill[];
  initialYear: number;
  initialMonth: number;
  accounts: Account[];
  categories: Category[];
}

function parseDateKey(date: string): Date {
  const [year, month, day] = toDateOnlyString(date).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueLabel(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseDateKey(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === -1) return "Due yesterday";
  if (diffDays < -1) return `Overdue by ${Math.abs(diffDays)} days`;

  return formatDisplayDate(dueDate);
}

function buildCalendarGrid(year: number, month: number) {
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

export function UpcomingAgenda({
  initialBills,
  initialYear,
  initialMonth,
  accounts,
  categories,
}: UpcomingAgendaProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [bills, setBills] = useState(initialBills);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<ScheduledBill | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<ScheduledBill | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [isPaying, setIsPaying] = useState(false);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(
    () => buildCalendarGrid(year, month),
    [year, month]
  );

  const pendingBillDates = useMemo(() => {
    const dates = new Set<string>();
    for (const bill of bills) {
      if (!bill.isPaid) {
        dates.add(bill.dueDate);
      }
    }
    return dates;
  }, [bills]);

  const remainingToPay = useMemo(
    () =>
      bills
        .filter((bill) => !bill.isPaid)
        .reduce((sum, bill) => sum + parseFloat(bill.amount), 0),
    [bills]
  );

  const sortedBills = useMemo(
    () =>
      [...bills].sort((a, b) => {
        if (a.dueDate === b.dueDate) {
          return a.title.localeCompare(b.title);
        }
        return a.dueDate.localeCompare(b.dueDate);
      }),
    [bills]
  );

  function loadMonth(nextYear: number, nextMonth: number) {
    startTransition(async () => {
      const nextBills = await getScheduledBillsForMonth(
        nextYear,
        nextMonth + 1
      );
      setYear(nextYear);
      setMonth(nextMonth);
      setBills(nextBills);
      setSelectedDateKey(null);
    });
  }

  function refreshBills() {
    startTransition(async () => {
      const nextBills = await getScheduledBillsForMonth(year, month + 1);
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

  function openPayDialog(bill: ScheduledBill) {
    setBillToPay(bill);
    setSelectedAccountId(bill.accountId ?? accounts[0]?.id ?? "");
    setPayDialogOpen(true);
  }

  function openEditDialog(bill: ScheduledBill) {
    setBillToEdit(bill);
    setEditOpen(true);
  }

  function handleBillUpdated() {
    refreshBills();
  }

  function handleBillDeleted(billId: string) {
    setBills((current) => current.filter((bill) => bill.id !== billId));
    setBillToEdit(null);
    refreshBills();
  }

  async function handleConfirmPay() {
    if (!billToPay) {
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select an account.");
      return;
    }

    setIsPaying(true);

    try {
      await payScheduledBill(billToPay.id, selectedAccountId);
      setBills((current) =>
        current.map((bill) =>
          bill.id === billToPay.id ? { ...bill, isPaid: true } : bill
        )
      );
      setPayDialogOpen(false);
      setBillToPay(null);
      toast.success(`${billToPay.title} marked as paid.`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to mark bill as paid."
      );
    } finally {
      setIsPaying(false);
    }
  }

  const todayKey = toDateKey(new Date());

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-900" />
                <h2 className="text-lg font-bold text-slate-900">Upcoming Agenda</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Scheduled bills and due dates for the month.
              </p>
            </div>
            <CreateScheduledBillModal
              accounts={accounts}
              categories={categories}
              viewedYear={year}
              viewedMonth={month}
              onCreated={refreshBills}
              trigger={
                <Button variant="premium" className="w-full sm:w-auto">
                  New Scheduled Bill
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
          <div className={cn(isPending && "opacity-60")}>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-base font-semibold text-slate-900">
                {monthLabel}
              </h3>
              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {label}
                </div>
              ))}

              {calendarDays.map(({ date, dateKey, isCurrentMonth }) => {
                const isSelected = selectedDateKey === dateKey;
                const isToday = dateKey === todayKey;
                const hasPendingBill = pendingBillDates.has(dateKey);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(dateKey)}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col items-center justify-start bg-white px-1 py-2 transition-colors",
                      !isCurrentMonth && "bg-slate-50/80 text-slate-300",
                      isSelected && "bg-blue-50 ring-1 ring-inset ring-blue-200",
                      !isSelected && "hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                        isToday && "bg-slate-900 text-white",
                        !isToday && isCurrentMonth && "text-slate-800",
                        !isToday && !isCurrentMonth && "text-slate-300"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {hasPendingBill ? (
                      <span
                        className={cn(
                          "mt-2 h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-slate-900" : "bg-rose-500"
                        )}
                        aria-hidden
                      />
                    ) : (
                      <span className="mt-2 h-1.5 w-1.5" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Left to pay this month
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {formatCurrency(remainingToPay)}
              </p>
            </div>

            <div className="mt-4 flex-1">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Bills this month
              </h4>

              {sortedBills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm text-slate-400">
                    No scheduled bills for this month.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {sortedBills.map((bill) => (
                    <li
                      key={bill.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!bill.isPaid) {
                            openPayDialog(bill);
                          }
                        }}
                        disabled={bill.isPaid || isPaying}
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          bill.isPaid
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                        )}
                        aria-label={
                          bill.isPaid
                            ? `${bill.title} paid`
                            : `Mark ${bill.title} as paid`
                        }
                      >
                        {bill.isPaid ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : (
                          <Circle className="h-3 w-3 text-slate-300" />
                        )}
                      </button>

                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate font-medium text-slate-900",
                              bill.isPaid && "text-slate-500 line-through"
                            )}
                          >
                            {bill.title}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {formatDueLabel(bill.dueDate)}
                            {bill.categoryName ? ` · ${bill.categoryName}` : ""}
                            {bill.accountName ? ` · ${bill.accountName}` : ""}
                          </p>
                        </div>

                        <p
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            bill.isPaid ? "text-slate-400" : "text-slate-900"
                          )}
                        >
                          {formatCurrency(parseFloat(bill.amount))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditDialog(bill)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                        aria-label={`Edit ${bill.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

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

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay from which account?</DialogTitle>
            <DialogDescription>
              {billToPay
                ? `Record ${formatCurrency(parseFloat(billToPay.amount))} for "${billToPay.title}" as an expense today.`
                : "Select the account to pay this bill from."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="pay-bill-account"
              className="text-sm font-medium text-slate-700"
            >
              Account
            </label>
            <select
              id="pay-bill-account"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              className={premiumNativeSelectClass}
              disabled={accounts.length === 0 || isPaying}
            >
              {accounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))
              )}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="premium"
              onClick={handleConfirmPay}
              disabled={isPaying || !selectedAccountId}
            >
              {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPaying ? "Processing..." : "Confirm payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
