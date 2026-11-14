"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createCategory } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildCategoryFormValues,
  CategoryIosForm,
  type CategoryFormValues,
} from "@/components/categories/category-ios-form";

interface CreateCategoryModalProps {
  trigger?: React.ReactNode;
}

export function CreateCategoryModal({ trigger }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setFormKey((key) => key + 1);
    }
  }, [open]);

  async function handleSubmit(values: CategoryFormValues) {
    setLoading(true);

    try {
      await createCategory({
        name: values.name.trim(),
        type: values.type,
        color: values.color,
        groupName: values.groupName.trim() || null,
      });
      setOpen(false);
      toast.success("Category created!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create category."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="premium">New Category</Button>
        )}
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-md [&>button]:hidden">
        <CategoryIosForm
          key={formKey}
          title="New Category"
          initialValues={buildCategoryFormValues()}
          loading={loading}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
