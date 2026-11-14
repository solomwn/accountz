"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount, type AccountBalance } from "@/app/actions";
import { AccountEditDialog } from "@/components/accounts/account-edit-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountActionButtonsProps {
  account: AccountBalance;
  compact?: boolean;
  supportsAccountType?: boolean;
}

export function AccountActionButtons({
  account,
  compact = false,
  supportsAccountType = false,
}: AccountActionButtonsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleEdit(event?: React.MouseEvent) {
    event?.stopPropagation();
    setEditOpen(true);
  }

  async function handleDelete(event?: React.MouseEvent) {
    event?.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteAccount(account.id);
      toast.success("Account deleted!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-end",
          compact ? "gap-0.5" : "gap-1"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {compact ? (
          <>
            <button
              type="button"
              onClick={handleEdit}
              aria-label="Edit account"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-700"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              aria-label="Delete account"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 text-slate-600 hover:text-slate-900"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
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
          </>
        )}
      </div>

      <AccountEditDialog
        account={account}
        open={editOpen}
        onOpenChange={setEditOpen}
        supportsAccountType={supportsAccountType}
      />
    </>
  );
}
