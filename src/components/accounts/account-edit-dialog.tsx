"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateAccount,
  type AccountBalance,
  type AccountType,
  type LoanDetails,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  premiumDialogContentClass,
  premiumDialogFooterClass,
  premiumDialogHeaderClass,
  premiumDialogTitleClass,
  premiumInputClass,
  premiumLabelClass,
  premiumSubmitButtonClass,
} from "@/lib/premium-form-dialog";

const accountFormFieldsClass = "px-8 py-6 max-h-[65vh] overflow-y-auto";
const accountFormGridClass = "grid grid-cols-1 md:grid-cols-2 gap-6";
const premiumTextareaClass =
  "w-full min-h-[100px] resize-y p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium shadow-sm focus-visible:ring-0 focus-visible:border-blue-500 focus:ring-0 focus:border-blue-500 outline-none";

const emptyLoan: LoanDetails = {
  lender: null,
  interestRate: null,
  initialAmount: null,
  installmentAmount: null,
  nextPaymentDate: null,
  endDate: null,
};

type LoanForm = Record<keyof LoanDetails, string>;

function toLoanForm(loan: LoanDetails | undefined): LoanForm {
  const l = loan ?? emptyLoan;
  return {
    lender: l.lender ?? "",
    interestRate: l.interestRate ?? "",
    initialAmount: l.initialAmount ?? "",
    installmentAmount: l.installmentAmount ?? "",
    nextPaymentDate: l.nextPaymentDate ?? "",
    endDate: l.endDate ?? "",
  };
}

const loanFields: Array<{
  key: keyof LoanDetails;
  label: string;
  type: "text" | "number" | "date";
  step?: string;
  placeholder?: string;
}> = [
  { key: "lender", label: "Lender", type: "text", placeholder: "e.g. BOK" },
  { key: "interestRate", label: "Interest Rate (%)", type: "number", step: "any", placeholder: "e.g. 6.6124301" },
  { key: "initialAmount", label: "Loan Initial Amount", type: "number", step: "0.01" },
  { key: "installmentAmount", label: "Monthly Installment", type: "number", step: "0.01" },
  { key: "nextPaymentDate", label: "Next Payment Date", type: "date" },
  { key: "endDate", label: "Expiry Date", type: "date" },
];

interface AccountEditDialogProps {
  account: AccountBalance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supportsAccountType: boolean;
}

export function AccountEditDialog({
  account,
  open,
  onOpenChange,
  supportsAccountType,
}: AccountEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: account.name,
    currency: account.currency,
    openingBalance: account.openingBalance,
    alertLimit: account.alertLimit,
    notes: account.notes ?? "",
    accountType: account.accountType,
  });
  const [loanForm, setLoanForm] = useState<LoanForm>(toLoanForm(account.loan));
  const supportsLoanDetails = account.loan !== undefined;

  useEffect(() => {
    if (open) {
      setForm({
        name: account.name,
        currency: account.currency,
        openingBalance: account.openingBalance,
        alertLimit: account.alertLimit,
        notes: account.notes ?? "",
        accountType: account.accountType,
      });
      setLoanForm(toLoanForm(account.loan));
    }
  }, [open, account]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      await updateAccount(account.id, {
        name: form.name,
        currency: form.currency,
        openingBalance: parseFloat(form.openingBalance) || 0,
        alertLimit: parseFloat(form.alertLimit) || 0,
        notes: form.notes || undefined,
        accountType: form.accountType,
        ...(supportsLoanDetails && form.accountType === "liability"
          ? {
              loan: {
                lender: loanForm.lender,
                interestRate: loanForm.interestRate,
                initialAmount: loanForm.initialAmount,
                installmentAmount: loanForm.installmentAmount,
                nextPaymentDate: loanForm.nextPaymentDate,
                endDate: loanForm.endDate,
              },
            }
          : {}),
      });
      onOpenChange(false);
      toast.success("Account updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={premiumDialogContentClass}>
        <DialogHeader className={premiumDialogHeaderClass}>
          <DialogTitle className={premiumDialogTitleClass}>
            Edit Account
          </DialogTitle>
          <DialogDescription>
            Update the details for this account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className={accountFormFieldsClass}>
            <div className={accountFormGridClass}>
              <div>
                <Label
                  htmlFor={`account-name-${account.id}`}
                  className={premiumLabelClass}
                >
                  Name
                </Label>
                <Input
                  id={`account-name-${account.id}`}
                  className={premiumInputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor={`account-currency-${account.id}`}
                  className={premiumLabelClass}
                >
                  Currency
                </Label>
                <Input
                  id={`account-currency-${account.id}`}
                  className={premiumInputClass}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor={`account-opening-balance-${account.id}`}
                  className={premiumLabelClass}
                >
                  Opening Balance
                </Label>
                <Input
                  id={`account-opening-balance-${account.id}`}
                  className={premiumInputClass}
                  type="number"
                  step="0.01"
                  value={form.openingBalance}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      openingBalance: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor={`account-alert-limit-${account.id}`}
                  className={premiumLabelClass}
                >
                  Alert Limit
                </Label>
                <Input
                  id={`account-alert-limit-${account.id}`}
                  className={premiumInputClass}
                  type="number"
                  step="0.01"
                  value={form.alertLimit}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      alertLimit: e.target.value,
                    }))
                  }
                />
              </div>

              {supportsAccountType ? (
                <div>
                  <Label
                    htmlFor={`account-type-${account.id}`}
                    className={premiumLabelClass}
                  >
                    Account Type
                  </Label>
                  <Select
                    value={form.accountType}
                    onValueChange={(value: AccountType) =>
                      setForm((prev) => ({ ...prev, accountType: value }))
                    }
                  >
                    <SelectTrigger
                      id={`account-type-${account.id}`}
                      className={premiumInputClass}
                    >
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">
                        Asset (bank, cash, savings)
                      </SelectItem>
                      <SelectItem value="liability">
                        Loan / Liability
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            {supportsLoanDetails && form.accountType === "liability" ? (
              <div className="mt-8">
                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Loan details
                </p>
                <div className={accountFormGridClass}>
                  {loanFields.map((field) => (
                    <div key={field.key}>
                      <Label
                        htmlFor={`account-loan-${field.key}-${account.id}`}
                        className={premiumLabelClass}
                      >
                        {field.label}
                      </Label>
                      <Input
                        id={`account-loan-${field.key}-${account.id}`}
                        className={premiumInputClass}
                        type={field.type}
                        step={field.step}
                        placeholder={field.placeholder}
                        value={loanForm[field.key]}
                        onChange={(e) =>
                          setLoanForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2">
              <Label
                htmlFor={`account-notes-${account.id}`}
                className={premiumLabelClass}
              >
                Notes
              </Label>
              <textarea
                id={`account-notes-${account.id}`}
                className={premiumTextareaClass}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className={premiumDialogFooterClass}>
            <Button
              type="submit"
              disabled={loading}
              className={premiumSubmitButtonClass}
            >
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
