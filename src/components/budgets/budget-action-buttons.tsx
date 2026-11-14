"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteBudget,
  updateBudget,
  type Budget,
  type Category,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildBudgetFormValues,
  BudgetIosForm,
  type BudgetFormValues,
} from "@/components/budgets/budget-ios-form";

interface BudgetActionButtonsProps {
  budget: Budget;
  categories: Category[];
}

export function BudgetActionButtons({
  budget,
  categories,
}: BudgetActionButtonsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const initialValues = buildBudgetFormValues(budget.type, categories, {
    categoryId: budget.categoryId,
    amount: budget.amount,
    type: budget.type,
  });

  useEffect(() => {
    if (editOpen) {
      setFormKey((key) => key + 1);
    }
  }, [editOpen, budget]);

  async function handleEditSubmit(values: BudgetFormValues) {
    setEditLoading(true);

    try {
      await updateBudget(budget.id, {
        categoryId: values.categoryId,
        amount: parseFloat(values.amount),
        type: values.type,
      });
      setEditOpen(false);
      toast.success("Budget updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update budget.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteBudget(budget.id);
      toast.success("Budget deleted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete budget.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-600 hover:text-slate-900"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
          <BudgetIosForm
            key={formKey}
            categories={categories}
            title="Edit Budget"
            initialValues={initialValues}
            loading={editLoading}
            onCancel={() => setEditOpen(false)}
            onSubmit={handleEditSubmit}
          />
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleteLoading}
        className="h-8 text-slate-600 hover:text-red-600"
      >
        {deleteLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete
      </Button>
    </div>
  );
}
