"use client";

import { useEffect, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteTransaction,
  updateTransaction,
  type Account,
  type Category,
  type Transaction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildTransactionFormValues,
  TransactionIosForm,
  type TransactionFormValues,
} from "@/components/transactions/transaction-ios-form";

interface TransactionActionButtonsProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
}

export function TransactionActionButtons({
  transaction,
  accounts,
  categories,
}: TransactionActionButtonsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const initialValues = buildTransactionFormValues(transaction.type, categories, {
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    categoryId: transaction.categoryId,
    date: transaction.date,
    accountId: transaction.accountId,
  });

  useEffect(() => {
    if (editOpen) {
      setFormKey((key) => key + 1);
    }
  }, [editOpen, transaction]);

  async function handleEditSubmit(values: TransactionFormValues) {
    setEditLoading(true);

    try {
      await updateTransaction(transaction.id, {
        description: values.description.trim(),
        amount: parseFloat(values.amount),
        type: values.type,
        categoryId: values.categoryId,
        date: values.date,
        accountId: values.accountId,
      });
      setEditOpen(false);
      toast.success("Transaction updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update transaction.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteTransaction(transaction.id);
      toast.success("Transaction deleted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
            aria-label="Transaction actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {transaction.type !== "transfer" ? (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            disabled={deleteLoading}
            className="text-rose-600 focus:text-rose-600"
            onSelect={handleDelete}
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {transaction.type !== "transfer" ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
            <TransactionIosForm
              key={formKey}
              accounts={accounts}
              categories={categories}
              initialValues={initialValues}
              title="Edit Transaction"
              loading={editLoading}
              onCancel={() => setEditOpen(false)}
              onSubmit={handleEditSubmit}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
