"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/app/actions";
import {
  filterCategoriesByType,
  getDefaultCategoryId,
} from "@/lib/category-utils";
import { cn } from "@/lib/utils";
import {
  premiumModalBackButtonClass,
  premiumModalCancelButtonClass,
  premiumModalCheckIconClass,
  premiumModalSaveButtonClass,
} from "@/lib/premium-form-dialog";

export interface BudgetFormValues {
  categoryId: string;
  amount: string;
  type: "income" | "expense";
}

type PickerView = "main" | "category";

interface BudgetIosFormProps {
  categories: Category[];
  initialValues: BudgetFormValues;
  title: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: BudgetFormValues) => Promise<void>;
}

interface FormRowProps {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  showChevron?: boolean;
}

function FormRow({ label, onPress, children, showChevron = true }: FormRowProps) {
  const content = (
    <>
      <span className="shrink-0 text-slate-900">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {children}
        {showChevron && onPress ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        ) : null}
      </div>
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="flex w-full items-center justify-between gap-4 border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0">
      {content}
    </div>
  );
}

function PickerHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center border-b border-slate-200 bg-white px-2 py-3">
      <button
        type="button"
        onClick={onBack}
        className={premiumModalBackButtonClass}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <h3 className="flex-1 text-center text-base font-semibold text-slate-900">
        {title}
      </h3>
      <div className="w-[4.5rem]" />
    </div>
  );
}

export function buildBudgetFormValues(
  type: "income" | "expense" = "expense",
  categories: Category[] = [],
  overrides: Partial<BudgetFormValues> = {}
): BudgetFormValues {
  return {
    categoryId: getDefaultCategoryId(categories, type),
    amount: "",
    type,
    ...overrides,
  };
}

export function BudgetIosForm({
  categories,
  initialValues,
  title,
  loading = false,
  onCancel,
  onSubmit,
}: BudgetIosFormProps) {
  const [form, setForm] = useState<BudgetFormValues>(initialValues);
  const [pickerView, setPickerView] = useState<PickerView>("main");

  useEffect(() => {
    setForm(initialValues);
    setPickerView("main");
  }, [initialValues]);

  const filteredCategories = useMemo(
    () => filterCategoriesByType(categories, form.type),
    [categories, form.type]
  );

  const selectedCategory = categories.find(
    (category) => category.id === form.categoryId
  );

  function handleTypeChange(type: "income" | "expense") {
    setForm((prev) => ({
      ...prev,
      type,
      categoryId: getDefaultCategoryId(categories, type),
    }));
  }

  async function handleSave() {
    if (!form.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    await onSubmit(form);
  }

  if (pickerView === "category") {
    return (
      <div className="flex flex-col bg-slate-50">
        <PickerHeader title="Category" onBack={() => setPickerView("main")} />
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {filteredCategories.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">
                No categories available
              </p>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = category.id === form.categoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, categoryId: category.id }));
                      setPickerView("main");
                    }}
                    className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span
                        className={cn(
                          "text-slate-700",
                          isSelected && "font-medium text-slate-900"
                        )}
                      >
                        {category.name}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className={premiumModalCheckIconClass} />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className={premiumModalCancelButtonClass}
        >
          Cancel
        </button>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || filteredCategories.length === 0}
          className={premiumModalSaveButtonClass}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </button>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-3">
        <div className="flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-full py-2 transition-colors",
              form.type === "income"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            )}
            aria-label="Income"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-full py-2 transition-colors",
              form.type === "expense"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            )}
            aria-label="Expense"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          {form.type === "income" ? "Income target" : "Expense limit"}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <FormRow label="Category" onPress={() => setPickerView("category")}>
            <span className="truncate text-sm text-slate-500">
              {selectedCategory?.name ?? "Select"}
            </span>
          </FormRow>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <FormRow label="Amount" showChevron={false}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="0.00"
              className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </FormRow>
        </div>
      </div>
    </div>
  );
}
