"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createScheduledBill, type Account, type Category } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildScheduledBillFormValues,
  ScheduledBillIosForm,
  type ScheduledBillFormValues,
} from "@/components/budgets/scheduled-bill-ios-form";
import {
  getDefaultDueDateForViewedMonth,
  getLocalDateString,
} from "@/lib/format";

interface CreateScheduledBillModalProps {
  accounts: Account[];
  categories: Category[];
  viewedYear?: number;
  /** Zero-indexed month (matches JavaScript Date.getMonth()). */
  viewedMonth?: number;
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

export function CreateScheduledBillModal({
  accounts,
  categories,
  viewedYear,
  viewedMonth,
  trigger,
  onCreated,
}: CreateScheduledBillModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultDueDate =
    viewedYear !== undefined && viewedMonth !== undefined
      ? getDefaultDueDateForViewedMonth(viewedYear, viewedMonth)
      : getLocalDateString();

  const initialValues = useMemo(
    () =>
      buildScheduledBillFormValues({
        accountId: accounts[0]?.id ?? "",
        dueDate: defaultDueDate,
      }),
    [accounts, defaultDueDate]
  );

  useEffect(() => {
    if (open) {
      setFormKey((key) => key + 1);
    }
  }, [open, accounts, viewedYear, viewedMonth, defaultDueDate]);

  async function handleSubmit(values: ScheduledBillFormValues) {
    setLoading(true);

    try {
      await createScheduledBill({
        title: values.title.trim(),
        amount: parseFloat(values.amount),
        dueDate: values.dueDate,
        categoryId: values.categoryId || null,
        accountId: values.accountId || null,
      });
      setOpen(false);
      onCreated?.();
      toast.success("Scheduled bill added!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create scheduled bill."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="premium">
            New Scheduled Bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        <ScheduledBillIosForm
          key={formKey}
          accounts={accounts}
          categories={categories}
          title="New Scheduled Bill"
          initialValues={initialValues}
          loading={loading}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
