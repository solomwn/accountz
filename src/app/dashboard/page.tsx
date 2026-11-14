import {
  getAccounts,
  getCategories,
  getCurrentMonthBudgetSummary,
  getYearlyCashFlow,
  getMonthlyComparison,
  getSpendingByGroupThisMonth,
  getUnpaidScheduledBillsThisMonth,
} from "@/app/actions";
import { Dashboard } from "@/components/dashboard/dashboard";
import {
  getBudgetBarFill,
  getMonthOverMonthBarFill,
  getMonthOverMonthChangePercent,
} from "@/lib/dashboard-metrics";

export default async function DashboardPage() {
  const [
    monthlyComparison,
    cashFlowData,
    spendingByGroupData,
    budgetSummary,
    unpaidBills,
    accounts,
    categories,
  ] = await Promise.all([
    getMonthlyComparison(),
    getYearlyCashFlow(),
    getSpendingByGroupThisMonth(),
    getCurrentMonthBudgetSummary(),
    getUnpaidScheduledBillsThisMonth(),
    getAccounts(),
    getCategories(),
  ]);

  const currentMonthSavings =
    monthlyComparison.currentMonthIncome - monthlyComparison.currentMonthExpense;
  const lastMonthSavings =
    monthlyComparison.lastMonthIncome - monthlyComparison.lastMonthExpense;

  const incomeTrend = getMonthOverMonthChangePercent(
    monthlyComparison.currentMonthIncome,
    monthlyComparison.lastMonthIncome
  );
  const expenseTrend = getMonthOverMonthChangePercent(
    monthlyComparison.currentMonthExpense,
    monthlyComparison.lastMonthExpense
  );
  const savingsTrend = getMonthOverMonthChangePercent(
    currentMonthSavings,
    lastMonthSavings
  );

  const incomeBarFill = getMonthOverMonthBarFill(
    monthlyComparison.currentMonthIncome,
    monthlyComparison.lastMonthIncome
  );
  const expenseBarFill = getMonthOverMonthBarFill(
    monthlyComparison.currentMonthExpense,
    monthlyComparison.lastMonthExpense
  );
  const savingsBarFill = getMonthOverMonthBarFill(
    currentMonthSavings,
    lastMonthSavings
  );
  const budgetBarFill = getBudgetBarFill(
    budgetSummary.totalPaid,
    budgetSummary.totalPlanned
  );

  return (
    <Dashboard
      totalIncome={monthlyComparison.currentMonthIncome}
      totalExpenses={monthlyComparison.currentMonthExpense}
      netSavings={currentMonthSavings}
      incomeTrend={incomeTrend}
      expenseTrend={expenseTrend}
      savingsTrend={savingsTrend}
      incomeBarFill={incomeBarFill}
      expenseBarFill={expenseBarFill}
      savingsBarFill={savingsBarFill}
      budgetPlanned={budgetSummary.totalPlanned}
      budgetPaid={budgetSummary.totalPaid}
      budgetRemaining={budgetSummary.remaining}
      budgetBarFill={budgetBarFill}
      upcomingBills={unpaidBills}
      accounts={accounts}
      categories={categories}
      cashFlowData={cashFlowData}
      spendingByGroupData={spendingByGroupData}
    />
  );
}
