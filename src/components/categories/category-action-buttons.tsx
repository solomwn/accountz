"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, updateCategory, type Category } from "@/app/actions";
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

interface CategoryActionButtonsProps {
  category: Category;
}

export function CategoryActionButtons({ category }: CategoryActionButtonsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const initialValues = buildCategoryFormValues({
    name: category.name,
    type: category.type,
    color: category.color,
    groupName: category.groupName ?? "",
  });

  useEffect(() => {
    if (editOpen) {
      setFormKey((key) => key + 1);
    }
  }, [editOpen, category]);

  async function handleEditSubmit(values: CategoryFormValues) {
    setEditLoading(true);

    try {
      await updateCategory(category.id, {
        name: values.name.trim(),
        type: values.type,
        color: values.color,
        groupName: values.groupName.trim() || null,
      });
      setEditOpen(false);
      toast.success("Category updated!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update category."
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteCategory(category.id);
      toast.success("Category deleted!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category."
      );
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
          <CategoryIosForm
            key={formKey}
            title="Edit Category"
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
