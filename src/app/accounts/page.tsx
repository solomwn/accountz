import { getAccountBalances, getSchemaCapabilities, getTransactions } from "@/app/actions";
import { AccountsPageClient } from "@/components/accounts/accounts-page-client";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
import { Button } from "@/components/ui/button";

export default async function AccountsPage() {
  const [accounts, transactions, schemaCapabilities] = await Promise.all([
    getAccountBalances(),
    getTransactions(),
    getSchemaCapabilities(),
  ]);

  return (
    <div className="-mx-4 min-h-[calc(100vh-3.5rem)] bg-slate-100 px-4 py-4 lg:py-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select an account to review transactions and details.
          </p>
        </div>
        <CreateAccountModal
          trigger={<Button variant="premium">New Account</Button>}
          supportsAccountType={schemaCapabilities.accountType}
        />
      </div>

      <div className="mt-4">
        <AccountsPageClient
          accounts={accounts}
          transactions={transactions}
          supportsAccountType={schemaCapabilities.accountType}
        />
      </div>
    </div>
  );
}
