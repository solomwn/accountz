"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getRecentPayees,
  type Account,
  type Category,
  type RecentPayee,
  type ScheduledBill,
} from "@/app/actions";
import { filterCategoriesByType } from "@/lib/category-utils";
import { formatDisplayDate, getLocalDateString } from "@/lib/format";
import { findCategoryIdForPayeeDescription } from "@/lib/payee-category";
import {
  premiumModalBackButtonClass,
  premiumModalCancelButtonClass,
  premiumModalCheckIconClass,
  premiumModalSaveButtonClass,
} from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";

export interface ScheduledBillFormValues {
  title: string;
  amount: string;
  dueDate: string;
  categoryId: string;
  accountId: string;
}

type PickerView = "main" | "category" | "date" | "account";

interface ScheduledBillIosFormProps {
  accounts: Account[];
  categories: Category[];
  initialValues: ScheduledBillFormValues;
  bill?: ScheduledBill;
  title?: string;
  loading?: boolean;
  deleteLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: ScheduledBillFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
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

function InlineField({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-0 flex-1 border-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none focus:ring-0"
    />
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

export function buildScheduledBillFormValues(
  overrides: Partial<ScheduledBillFormValues> = {}
): ScheduledBillFormValues {
  return {
    title: "",
    amount: "",
    dueDate: getLocalDateString(),
    categoryId: "",
    accountId: "",
    ...overrides,
  };
}

export function buildScheduledBillFormValuesFromBill(
  bill: ScheduledBill
): ScheduledBillFormValues {
  return buildScheduledBillFormValues({
    title: bill.title,
    amount: bill.amount,
    dueDate: bill.dueDate,
    categoryId: bill.categoryId ?? "",
    accountId: bill.accountId ?? "",
  });
}

function getAccountLabel(account: Account): string {
  return `${account.name} (${account.currency})`;
}

export function ScheduledBillIosForm({
  accounts,
  categories,
  initialValues,
  bill,
  title,
  loading = false,
  deleteLoading = false,
  onCancel,
  onSubmit,
  onDelete,
}: ScheduledBillIosFormProps) {
  const [recentPayees, setRecentPayees] = useState<RecentPayee[]>([]);
  const [form, setForm] = useState<ScheduledBillFormValues>(initialValues);
  const [pickerView, setPickerView] = useState<PickerView>("main");
  const categoryManuallyOverridden = useRef(false);

  const expenseCategories = useMemo(
    () => filterCategoriesByType(categories, "expense"),
    [categories]
  );

  const expenseCategoryIds = useMemo(
    () => new Set(expenseCategories.map((category) => category.id)),
    [expenseCategories]
  );

  const selectedCategory = expenseCategories.find(
    (category) => category.id === form.categoryId
  );

  const selectedAccount = accounts.find((account) => account.id === form.accountId);

  const headerTitle = title ?? (bill ? "Edit Scheduled Bill" : "New Scheduled Bill");

  useEffect(() => {
    setForm(initialValues);
    setPickerView("main");
    categoryManuallyOverridden.current = false;
  }, [initialValues]);

  useEffect(() => {
    let cancelled = false;

    getRecentPayees()
      .then((payees) => {
        if (!cancelled) {
          setRecentPayees(payees);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleTitleChange(title: string) {
    setForm((prev) => {
      const next = { ...prev, title };

      if (!categoryManuallyOverridden.current) {
        const matchedCategoryId = findCategoryIdForPayeeDescription(
          title,
          recentPayees
        );

        if (matchedCategoryId && expenseCategoryIds.has(matchedCategoryId)) {
          next.categoryId = matchedCategoryId;
        }
      }

      return next;
    });
  }

  function handleCategorySelect(categoryId: string) {
    categoryManuallyOverridden.current = true;
    setForm((prev) => ({ ...prev, categoryId }));
    setPickerView("main");
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!form.dueDate) {
      toast.error("Please select a due date.");
      return;
    }

    await onSubmit(form);
  }

  if (pickerView === "account") {
    return (
      <div className="flex max-h-[min(32rem,70vh)] flex-col bg-slate-50">
        <PickerHeader title="Account" onBack={() => setPickerView("main")} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, accountId: "" }));
                setPickerView("main");
              }}
              className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50"
            >
              <span
                className={cn(
                  "text-slate-700",
                  !form.accountId && "font-medium text-slate-900"
                )}
              >
                None
              </span>
              {!form.accountId ? (
                <Check className={premiumModalCheckIconClass} />
              ) : null}
            </button>
            {accounts.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">
                No accounts available
              </p>
            ) : (
              accounts.map((account) => {
                const isSelected = account.id === form.accountId;

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, accountId: account.id }));
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
                      {getAccountLabel(account)}
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

  if (pickerView === "category") {
    return (
      <div className="flex max-h-[min(32rem,70vh)] flex-col bg-slate-50">
        <PickerHeader title="Category" onBack={() => setPickerView("main")} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50"
            >
              <span
                className={cn(
                  "text-slate-700",
                  !form.categoryId && "font-medium text-slate-900"
                )}
              >
                None
              </span>
              {!form.categoryId ? (
                <Check className={premiumModalCheckIconClass} />
              ) : null}
            </button>
            {expenseCategories.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">
                No categories available
              </p>
            ) : (
              expenseCategories.map((category) => {
                const isSelected = category.id === form.categoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
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

  if (pickerView === "date") {
    return (
      <div className="flex flex-col bg-slate-50">
        <PickerHeader title="Due Date" onBack={() => setPickerView("main")} />
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-0"
            />
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
        <h2 className="text-base font-semibold text-slate-900">{headerTitle}</h2>
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
          <FormRow label="Title" showChevron={false}>
            <InlineField
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Netflix"
            />
          </FormRow>

          <FormRow label="Category" onPress={() => setPickerView("category")}>
            <span className="truncate text-sm text-slate-500">
              {selectedCategory?.name ?? "Select"}
            </span>
          </FormRow>

          <FormRow label="Account" onPress={() => setPickerView("account")}>
            <span className="truncate text-sm text-slate-500">
              {selectedAccount ? getAccountLabel(selectedAccount) : "Select"}
            </span>
          </FormRow>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <FormRow label="Due Date" onPress={() => setPickerView("date")}>
            <span className="text-sm text-slate-500">
              {formatDisplayDate(form.dueDate)}
            </span>
          </FormRow>

          <FormRow label="Amount" showChevron={false}>
            <InlineField
              value={form.amount}
              onChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
              placeholder="0.00"
              type="number"
              inputMode="decimal"
            />
          </FormRow>
        </div>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading || deleteLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Delete Scheduled Bill
          </button>
        ) : null}
      </div>
    </div>
  );
}
