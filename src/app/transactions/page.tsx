import { getAccounts, getCategories, getTransactions } from "@/app/actions";
import { TransactionsList } from "@/components/transactions/transactions-list";

export default async function TransactionsPage() {
  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="-mx-4 min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 py-4 sm:py-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <TransactionsList
        transactions={transactions}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
