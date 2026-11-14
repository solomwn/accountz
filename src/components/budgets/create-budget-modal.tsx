"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createBudget, type Category } from "@/app/actions";
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

interface CreateBudgetModalProps {
  categories: Category[];
  defaultType?: "income" | "expense";
  trigger?: React.ReactNode;
}

export function CreateBudgetModal({
  categories,
  defaultType = "expense",
  trigger,
}: CreateBudgetModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setFormKey((key) => key + 1);
    }
  }, [open, defaultType, categories]);

  async function handleSubmit(values: BudgetFormValues) {
    setLoading(true);

    try {
      await createBudget({
        categoryId: values.categoryId,
        amount: parseFloat(values.amount),
        type: values.type,
      });
      setOpen(false);
      toast.success("Budget created!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create budget.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="premium">New Budget</Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        <BudgetIosForm
          key={formKey}
          categories={categories}
          title="New Budget"
          initialValues={buildBudgetFormValues(defaultType, categories)}
          loading={loading}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
