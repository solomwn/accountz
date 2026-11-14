"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteScheduledBill,
  updateScheduledBill,
  type Account,
  type Category,
  type ScheduledBill,
} from "@/app/actions";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  buildScheduledBillFormValuesFromBill,
  ScheduledBillIosForm,
  type ScheduledBillFormValues,
} from "@/components/budgets/scheduled-bill-ios-form";

interface EditScheduledBillModalProps {
  bill: ScheduledBill | null;
  accounts: Account[];
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onDeleted: (billId: string) => void;
}

export function EditScheduledBillModal({
  bill,
  accounts,
  categories,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditScheduledBillModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open && bill) {
      setFormKey((key) => key + 1);
    }
  }, [open, bill]);

  async function handleSubmit(values: ScheduledBillFormValues) {
    if (!bill) {
      return;
    }

    setLoading(true);

    try {
      await updateScheduledBill(bill.id, {
        title: values.title.trim(),
        amount: parseFloat(values.amount),
        dueDate: values.dueDate,
        categoryId: values.categoryId || null,
        accountId: values.accountId || null,
      });
      onOpenChange(false);
      onUpdated();
      toast.success("Scheduled bill updated!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update scheduled bill."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!bill) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this scheduled bill?")) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteScheduledBill(bill.id);
      onOpenChange(false);
      onDeleted(bill.id);
      toast.success("Scheduled bill deleted!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete scheduled bill."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!bill) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        <ScheduledBillIosForm
          key={formKey}
          accounts={accounts}
          categories={categories}
          bill={bill}
          title="Edit Scheduled Bill"
          initialValues={buildScheduledBillFormValuesFromBill(bill)}
          loading={loading}
          deleteLoading={deleteLoading}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
