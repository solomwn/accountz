"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  premiumModalBackButtonClass,
  premiumModalCancelButtonClass,
  premiumModalCheckIconClass,
  premiumModalSaveButtonClass,
} from "@/lib/premium-form-dialog";

export interface CategoryFormValues {
  name: string;
  type: "income" | "expense";
  color: string;
  groupName: string;
}

type PickerView = "main" | "type";

interface CategoryIosFormProps {
  initialValues: CategoryFormValues;
  title: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
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

const TYPE_OPTIONS: { value: "income" | "expense"; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export function buildCategoryFormValues(
  overrides: Partial<CategoryFormValues> = {}
): CategoryFormValues {
  return {
    name: "",
    type: "expense",
    color: "#6366f1",
    groupName: "",
    ...overrides,
  };
}

export function CategoryIosForm({
  initialValues,
  title,
  loading = false,
  onCancel,
  onSubmit,
}: CategoryIosFormProps) {
  const [form, setForm] = useState<CategoryFormValues>(initialValues);
  const [pickerView, setPickerView] = useState<PickerView>("main");

  useEffect(() => {
    setForm(initialValues);
    setPickerView("main");
  }, [initialValues]);

  const typeLabel =
    TYPE_OPTIONS.find((option) => option.value === form.type)?.label ?? "Select";

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
      toast.error("Please enter a valid hex color.");
      return;
    }

    await onSubmit(form);
  }

  if (pickerView === "type") {
    return (
      <div className="flex flex-col bg-slate-50">
        <PickerHeader title="Type" onBack={() => setPickerView("main")} />
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {TYPE_OPTIONS.map((option) => {
              const isSelected = option.value === form.type;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, type: option.value }));
                    setPickerView("main");
                  }}
                  className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50"
                >
                  <span
                    className={cn(
                      "text-slate-700",
                      isSelected && "font-medium text-slate-900"
                    )}
                  >
                    {option.label}
                  </span>
                  {isSelected ? (
                    <Check className={premiumModalCheckIconClass} />
                  ) : null}
                </button>
              );
            })}
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
          disabled={loading}
          className={premiumModalSaveButtonClass}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <FormRow label="Name" showChevron={false}>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Groceries"
              className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </FormRow>

          <FormRow label="Type" onPress={() => setPickerView("type")}>
            <span className="text-sm text-slate-500">{typeLabel}</span>
          </FormRow>

          <FormRow label="Group" showChevron={false}>
            <input
              value={form.groupName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, groupName: e.target.value }))
              }
              placeholder="Utilities (optional)"
              className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </FormRow>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 p-4">
            <span className="shrink-0 text-slate-900">Color</span>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, color: e.target.value }))
                }
                className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                aria-label="Pick a color"
              />
              <input
                value={form.color}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="#6366f1"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
