"use client";

import { Loader2 } from "lucide-react";
import type { GroupTransaction } from "@/app/actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import { premiumModalCancelButtonClass } from "@/lib/premium-form-dialog";

interface SpendingGroupTransactionsModalProps {
  groupName: string | null;
  transactions: GroupTransaction[];
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpendingGroupTransactionsModal({
  groupName,
  transactions,
  loading,
  open,
  onOpenChange,
}: SpendingGroupTransactionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-lg [&>button]:hidden">
        <div className="flex max-h-[min(32rem,80vh)] flex-col bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={premiumModalCancelButtonClass}
            >
              Close
            </button>
            <h2 className="text-base font-semibold text-slate-900">
              {groupName ? `Transactions for ${groupName}` : "Transactions"}
            </h2>
            <div className="w-[4.5rem]" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
                No transactions found for this group this month.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>Date</span>
                  <span>Particular</span>
                  <span className="text-right">Amount</span>
                </div>
                <ul>
                  {transactions.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="tabular-nums text-slate-500">
                        {formatDisplayDate(transaction.date)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {transaction.description}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {transaction.category}
                        </p>
                      </div>
                      <span className="text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(parseFloat(transaction.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
