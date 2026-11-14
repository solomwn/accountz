"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { getRecentPayees, type Account, type Category, type RecentPayee } from "@/app/actions";
import {
  filterCategoriesByType,
  getDefaultCategoryId,
} from "@/lib/category-utils";
import { formatDisplayDate, getLocalDateString } from "@/lib/format";
import { findCategoryIdForPayeeDescription } from "@/lib/payee-category";
import {
  premiumModalBackButtonClass,
  premiumModalCancelButtonClass,
  premiumModalCheckIconClass,
  premiumModalSaveButtonClass,
} from "@/lib/premium-form-dialog";
import { cn } from "@/lib/utils";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";

const LAST_ACCOUNT_ID_KEY = "lastAccountId";

function saveLastAccountId(accountId: string) {
  if (accountId) {
    localStorage.setItem(LAST_ACCOUNT_ID_KEY, accountId);
  }
}

export interface TransactionFormValues {
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  categoryId: string;
  date: string;
  accountId: string;
  toAccountId: string;
  notes: string;
}

type PickerView =
  | "main"
  | "date"
  | "category"
  | "account"
  | "fromAccount"
  | "toAccount";
type UiTransactionType = "income" | "expense" | "transfer";

interface TransactionIosFormProps {
  accounts: Account[];
  categories: Category[];
  initialValues: TransactionFormValues;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}

function getTitle(type: UiTransactionType): string {
  if (type === "income") return "Income";
  if (type === "transfer") return "Transfer";
  return "Spending";
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

interface PickerHeaderProps {
  title: string;
  onBack: () => void;
}

function PickerHeader({ title, onBack }: PickerHeaderProps) {
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

export function TransactionIosForm({
  accounts,
  categories,
  initialValues,
  title,
  loading = false,
  onCancel,
  onSubmit,
}: TransactionIosFormProps) {
  const [recentPayees, setRecentPayees] = useState<RecentPayee[]>([]);
  const [form, setForm] = useState<TransactionFormValues>(initialValues);
  const [pickerView, setPickerView] = useState<PickerView>("main");
  const [uiType, setUiType] = useState<UiTransactionType>(
    initialValues.type === "transfer" ? "transfer" : initialValues.type
  );

  useEffect(() => {
    setForm(initialValues);
    setUiType(
      initialValues.type === "transfer" ? "transfer" : initialValues.type
    );
    setPickerView("main");
  }, [initialValues]);

  useEffect(() => {
    const saved = localStorage.getItem(LAST_ACCOUNT_ID_KEY);
    if (saved) {
      setForm((prev) => ({ ...prev, accountId: saved }));
    }
  }, []);

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

  const filteredCategories = useMemo(
    () => filterCategoriesByType(categories, form.type === "transfer" ? "expense" : form.type),
    [categories, form.type]
  );

  const selectedAccount = accounts.find((account) => account.id === form.accountId);
  const selectedToAccount = accounts.find((account) => account.id === form.toAccountId);
  const selectedCategory = categories.find((category) => category.id === form.categoryId);

  function getAccountLabel(account: Account) {
    return `${account.name} (${account.currency})`;
  }

  const headerTitle = title ?? getTitle(uiType);
  const isTransfer = uiType === "transfer";

  function applyPayeeCategoryFromDescription(description: string) {
    const matchedCategoryId = findCategoryIdForPayeeDescription(
      description,
      recentPayees
    );
    if (matchedCategoryId) {
      setForm((prev) => ({ ...prev, categoryId: matchedCategoryId }));
    }
  }

  function handleDetailsChange(text: string) {
    setForm((prev) => ({ ...prev, description: text }));
    applyPayeeCategoryFromDescription(text);
  }

  function handlePayeeSelect(option: { label: string; meta?: Record<string, string> }) {
    const categoryId = option.meta?.categoryId;
    setForm((prev) => ({
      ...prev,
      description: option.label,
      ...(categoryId ? { categoryId } : {}),
    }));
  }

  const payeeOptions = useMemo(
    () =>
      recentPayees.map((p) => {
        const category = categories.find((c) => c.id === p.categoryId);
        return {
          label: p.description,
          color: category?.color ?? "#94a3b8",
          meta: { categoryId: p.categoryId },
        };
      }),
    [recentPayees, categories]
  );

  function handleTypeChange(nextType: UiTransactionType) {
    setUiType(nextType);

    if (nextType === "transfer") {
      const fromId = form.accountId || accounts[0]?.id || "";
      const toId =
        form.toAccountId && form.toAccountId !== fromId
          ? form.toAccountId
          : accounts.find((account) => account.id !== fromId)?.id ?? "";

      setForm((prev) => ({
        ...prev,
        type: "transfer",
        accountId: fromId,
        toAccountId: toId,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      type: nextType,
      categoryId: getDefaultCategoryId(categories, nextType),
      toAccountId: "",
    }));
  }

  async function handleSave() {
    if (isTransfer) {
      if (!form.accountId || !form.toAccountId) {
        toast.error("Please select both accounts.");
        return;
      }

      if (form.accountId === form.toAccountId) {
        toast.error("From and To accounts must be different.");
        return;
      }

      if (!form.amount || parseFloat(form.amount) <= 0) {
        toast.error("Please enter a valid amount.");
        return;
      }

      await onSubmit(form);
      saveLastAccountId(form.accountId);
      return;
    }

    if (!form.accountId) {
      toast.error("Please select an account.");
      return;
    }

    if (!form.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Please enter details.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    await onSubmit(form);
    saveLastAccountId(form.accountId);
  }

  if (pickerView === "category") {
    return (
      <div className="flex max-h-[min(32rem,70vh)] flex-col bg-slate-50">
        <PickerHeader title="Category" onBack={() => setPickerView("main")} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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

  if (pickerView === "account" || pickerView === "fromAccount" || pickerView === "toAccount") {
    const pickerTitle =
      pickerView === "fromAccount"
        ? "From Account"
        : pickerView === "toAccount"
          ? "To Account"
          : "Account";

    return (
      <div className="flex max-h-[min(32rem,70vh)] flex-col bg-slate-50">
        <PickerHeader title={pickerTitle} onBack={() => setPickerView("main")} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {accounts.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">
                No accounts available
              </p>
            ) : (
              accounts.map((account) => {
                const isSelected =
                  pickerView === "toAccount"
                    ? account.id === form.toAccountId
                    : account.id === form.accountId;
                const isDisabled =
                  pickerView === "fromAccount"
                    ? account.id === form.toAccountId
                    : pickerView === "toAccount"
                      ? account.id === form.accountId
                      : false;

                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (pickerView === "toAccount") {
                        setForm((prev) => ({ ...prev, toAccountId: account.id }));
                      } else {
                        setForm((prev) => ({ ...prev, accountId: account.id }));
                        saveLastAccountId(account.id);
                      }
                      setPickerView("main");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 active:bg-slate-50",
                      isDisabled && "cursor-not-allowed opacity-40"
                    )}
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

  if (pickerView === "date") {
    return (
      <div className="flex flex-col bg-slate-50">
        <PickerHeader title="Date" onBack={() => setPickerView("main")} />
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
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
          disabled={
            loading ||
            accounts.length === 0 ||
            (!isTransfer && filteredCategories.length === 0) ||
            (isTransfer && accounts.length < 2)
          }
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
              uiType === "income"
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
              uiType === "expense"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            )}
            aria-label="Expense"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("transfer")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-full py-2 transition-colors",
              uiType === "transfer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            )}
            aria-label="Transfer"
          >
            <ArrowLeftRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isTransfer ? (
            <>
              <FormRow
                label="From Account"
                onPress={() => setPickerView("fromAccount")}
              >
                <span className="truncate text-sm text-slate-500">
                  {selectedAccount ? getAccountLabel(selectedAccount) : "Select"}
                </span>
              </FormRow>

              <FormRow
                label="To Account"
                onPress={() => setPickerView("toAccount")}
              >
                <span className="truncate text-sm text-slate-500">
                  {selectedToAccount ? getAccountLabel(selectedToAccount) : "Select"}
                </span>
              </FormRow>
            </>
          ) : (
            <FormRow label="Account" onPress={() => setPickerView("account")}>
              <span className="truncate text-sm text-slate-500">
                {selectedAccount ? getAccountLabel(selectedAccount) : "Select"}
              </span>
            </FormRow>
          )}

          <FormRow label="Details" showChevron={false}>
            <CreatableCombobox
              value={form.description}
              onChange={handleDetailsChange}
              onSelect={handlePayeeSelect}
              options={payeeOptions}
              placeholder={isTransfer ? "Transfer" : "e.g. Netflix"}
            />
          </FormRow>

          {!isTransfer ? (
            <FormRow label="Category" onPress={() => setPickerView("category")}>
              <span className="truncate text-sm text-slate-500">
                {selectedCategory?.name ?? "Select"}
              </span>
            </FormRow>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <FormRow label="Date" onPress={() => setPickerView("date")}>
            <span className="text-sm text-slate-500">
              {formatDisplayDate(form.date)}
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

          <FormRow label="Notes" showChevron={false}>
            <InlineField
              value={form.notes}
              onChange={(notes) => setForm((prev) => ({ ...prev, notes }))}
              placeholder="Optional"
            />
          </FormRow>
        </div>
      </div>
    </div>
  );
}

export function buildTransactionFormValues(
  type: "income" | "expense" | "transfer" = "expense",
  categories: Category[] = [],
  overrides: Partial<TransactionFormValues> = {}
): TransactionFormValues {
  const categoryType = type === "transfer" ? "expense" : type;
  return {
    description: "",
    amount: "",
    type,
    categoryId: getDefaultCategoryId(categories, categoryType),
    date: getLocalDateString(),
    accountId: "",
    toAccountId: "",
    notes: "",
    ...overrides,
  };
}
