"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createTransaction,
  markScheduledBillAsPaid,
  type Account,
  type Category,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildTransactionFormValues,
  TransactionIosForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-ios-form";

export type TransactionPrefill = Partial<
  Pick<
    TransactionFormValues,
    "description" | "amount" | "categoryId" | "type" | "date" | "accountId"
  >
>;

interface CreateTransactionModalProps {
  accounts: Account[];
  categories: Category[];
  defaultType?: "income" | "expense";
  defaultDate?: string;
  prefill?: TransactionPrefill;
  scheduledBillId?: string;
  scheduledBillRemaining?: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTransactionModal({
  accounts,
  categories,
  defaultType = "expense",
  defaultDate,
  prefill,
  scheduledBillId,
  scheduledBillRemaining,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: CreateTransactionModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isControlled = controlledOpen !== undefined;

  const initialValues = useMemo(
    () =>
      buildTransactionFormValues(prefill?.type ?? defaultType, categories, {
        accountId: accounts[0]?.id ?? "",
        ...(defaultDate ? { date: defaultDate } : {}),
        ...prefill,
      }),
    [
      accounts,
      categories,
      defaultDate,
      defaultType,
      prefill?.accountId,
      prefill?.amount,
      prefill?.categoryId,
      prefill?.date,
      prefill?.description,
      prefill?.type,
    ]
  );

  useEffect(() => {
    if (open) {
      setFormKey((key) => key + 1);
    }
  }, [open, initialValues]);

  async function handleSubmit(values: TransactionFormValues) {
    setLoading(true);

    try {
      const descriptionParts = [values.description.trim(), values.notes.trim()].filter(
        Boolean
      );
      const description =
        descriptionParts.join(" — ") || (values.type === "transfer" ? "Transfer" : "");

      if (values.type === "transfer") {
        await createTransaction({
          description,
          amount: parseFloat(values.amount),
          type: "transfer",
          date: values.date,
          accountId: values.accountId,
          toAccountId: values.toAccountId,
        });
      } else {
        await createTransaction({
          description,
          amount: parseFloat(values.amount),
          type: values.type,
          categoryId: values.categoryId,
          date: values.date,
          accountId: values.accountId,
        });
      }

      const paidAmount = parseFloat(values.amount);
      if (
        scheduledBillId &&
        scheduledBillRemaining !== undefined &&
        values.type === "expense" &&
        paidAmount >= scheduledBillRemaining
      ) {
        await markScheduledBillAsPaid(scheduledBillId);
      }

      setOpen(false);
      onSuccess?.();
      toast.success(
        values.type === "transfer" ? "Transfer completed!" : "Transaction added!"
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add transaction."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button>
              <Plus />
              Add Transaction
            </Button>
          </DialogTrigger>
        )
      ) : null}
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        <TransactionIosForm
          key={formKey}
          accounts={accounts}
          categories={categories}
          initialValues={initialValues}
          loading={loading}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
