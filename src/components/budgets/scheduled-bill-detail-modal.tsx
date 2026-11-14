"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  payScheduledBill,
  type Account,
  type ScheduledBill,
} from "@/app/actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDisplayDate } from "@/lib/format";
import {
  premiumLabelClass,
  premiumModalCancelButtonClass,
  premiumModalSaveButtonClass,
  premiumNativeSelectClass,
} from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";

function formatBillAmount(amount: string | number): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${value.toFixed(2)} €`;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0">
      <span className="shrink-0 text-slate-900">{label}</span>
      <div className="min-w-0 flex-1 text-right text-sm text-slate-500">
        {children}
      </div>
    </div>
  );
}

interface ScheduledBillDetailModalProps {
  bill: ScheduledBill | null;
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: (billId: string) => void;
  onEdit?: (bill: ScheduledBill) => void;
}

export function ScheduledBillDetailModal({
  bill,
  accounts,
  open,
  onOpenChange,
  onPaid,
  onEdit,
}: ScheduledBillDetailModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? ""
  );
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (open && bill) {
      setSelectedAccountId(bill.accountId ?? accounts[0]?.id ?? "");
    }
  }, [open, accounts, bill]);

  async function handlePayBill() {
    if (!bill) {
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select an account.");
      return;
    }

    setIsPaying(true);

    try {
      await payScheduledBill(bill.id, selectedAccountId);
      onPaid(bill.id);
      onOpenChange(false);
      toast.success(`${bill.title} marked as paid.`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to pay bill."
      );
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        {bill ? (
          <div className="flex flex-col bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPaying}
                className={premiumModalCancelButtonClass}
              >
                Close
              </button>
              <h2 className="text-base font-semibold text-slate-900">
                Bill Details
              </h2>
              <div className="flex items-center gap-2">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(bill)}
                    disabled={isPaying}
                    className="text-sm font-medium text-blue-600 active:opacity-70 disabled:opacity-40"
                  >
                    Edit
                  </button>
                ) : null}
                {!bill.isPaid ? (
                  <button
                    type="button"
                    onClick={handlePayBill}
                    disabled={isPaying || !selectedAccountId}
                    className={premiumModalSaveButtonClass}
                  >
                    {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Pay Bill
                  </button>
                ) : (
                  !onEdit ? <div className="w-[4.5rem]" /> : null
                )}
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <DetailRow label="Name">
                  <span className="font-medium text-slate-900">{bill.title}</span>
                </DetailRow>
                <DetailRow label="Amount">
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatBillAmount(bill.amount)}
                  </span>
                </DetailRow>
                <DetailRow label="Date">
                  {formatDisplayDate(bill.dueDate)}
                </DetailRow>
                <DetailRow label="Category">
                  {bill.categoryName ?? "Uncategorized"}
                </DetailRow>
                <DetailRow label="Account">
                  {bill.accountName ?? "Not set"}
                </DetailRow>
                <DetailRow label="Status">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      bill.isPaid
                        ? "bg-emerald-50 text-green-600"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {bill.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </DetailRow>
              </div>

              {!bill.isPaid ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label htmlFor="pay-bill-account" className={premiumLabelClass}>
                    Pay from account
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
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
