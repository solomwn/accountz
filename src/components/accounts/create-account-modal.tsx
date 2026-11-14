"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAccount, type AccountType } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const accountFormFieldsClass = "px-8 py-6";
const accountFormGridClass = "grid grid-cols-1 md:grid-cols-2 gap-6";
const premiumTextareaClass =
  "w-full min-h-[100px] resize-y p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium shadow-sm focus-visible:ring-0 focus-visible:border-blue-500 focus:ring-0 focus:border-blue-500 outline-none";

function getDefaultForm() {
  return {
    name: "",
    currency: "EUR",
    openingBalance: "",
    alertLimit: "",
    notes: "",
    accountType: "asset" as AccountType,
  };
}

interface CreateAccountModalProps {
  trigger?: React.ReactNode;
  supportsAccountType?: boolean;
}

export function CreateAccountModal({
  trigger,
  supportsAccountType = false,
}: CreateAccountModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(getDefaultForm);

  useEffect(() => {
    if (open) {
      setForm(getDefaultForm());
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      await createAccount({
        name: form.name,
        currency: form.currency,
        openingBalance: parseFloat(form.openingBalance) || 0,
        alertLimit: parseFloat(form.alertLimit) || 0,
        notes: form.notes || undefined,
        accountType: form.accountType,
      });
      setOpen(false);
      toast.success("Account created!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="premium">
            New Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={premiumDialogContentClass}>
        <DialogHeader className={premiumDialogHeaderClass}>
          <DialogTitle className={premiumDialogTitleClass}>
            New Account
          </DialogTitle>
          <DialogDescription>
            Add a bank account, wallet, or cash account to track separately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className={accountFormFieldsClass}>
            <div className={accountFormGridClass}>
              <div>
                <Label htmlFor="account-name" className={premiumLabelClass}>
                  Name
                </Label>
                <Input
                  id="account-name"
                  className={premiumInputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Checking, Savings, Cash"
                  required
                />
              </div>

              <div>
                <Label htmlFor="account-currency" className={premiumLabelClass}>
                  Currency
                </Label>
                <Input
                  id="account-currency"
                  className={premiumInputClass}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, currency: e.target.value }))
                  }
                  placeholder="EUR"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="account-opening-balance"
                  className={premiumLabelClass}
                >
                  Opening Balance
                </Label>
                <Input
                  id="account-opening-balance"
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
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label
                  htmlFor="account-alert-limit"
                  className={premiumLabelClass}
                >
                  Alert Limit
                </Label>
                <Input
                  id="account-alert-limit"
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
                  placeholder="0.00"
                />
              </div>

              {supportsAccountType ? (
                <div>
                  <Label htmlFor="account-type" className={premiumLabelClass}>
                    Account Type
                  </Label>
                  <Select
                    value={form.accountType}
                    onValueChange={(value: AccountType) =>
                      setForm((prev) => ({ ...prev, accountType: value }))
                    }
                  >
                    <SelectTrigger
                      id="account-type"
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
                  {form.accountType === "liability" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Use a negative opening balance for the amount owed (e.g.
                      -20000). Principal payments are recorded as transfers to
                      this account.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Label htmlFor="account-notes" className={premiumLabelClass}>
                Notes
              </Label>
              <textarea
                id="account-notes"
                className={premiumTextareaClass}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Optional notes about this account"
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
              {loading ? "Saving..." : "Save Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
