import { PiggyBank } from "lucide-react";
import {
  getAccounts,
  getBudgets,
  getCategories,
  getScheduledBillsForMonth,
} from "@/app/actions";
import { BudgetActionButtons } from "@/components/budgets/budget-action-buttons";
import { CreateBudgetModal } from "@/components/budgets/create-budget-modal";
import { BudgetCalendar } from "@/components/budgets/budget-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeBadge } from "@/components/ui/type-badge";
import {
  dataCardContentClass,
  dataCardHeaderClass,
  dataCardTitleClass,
  dataTableHeaderRowClass,
  expenseAmountClass,
  incomeAmountClass,
} from "@/lib/premium-data-card";
import { formatCurrency } from "@/lib/format";

export default async function BudgetsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [budgets, categories, scheduledBills, accounts] = await Promise.all([
    getBudgets(),
    getCategories(),
    getScheduledBillsForMonth(currentYear, currentMonth),
    getAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <BudgetCalendar
        initialBills={scheduledBills}
        initialYear={currentYear}
        initialMonth={now.getMonth()}
        categories={categories}
        accounts={accounts}
      />

      <Card>
        <CardHeader className={dataCardHeaderClass}>
          <CardTitle className={dataCardTitleClass}>Budgets & Targets</CardTitle>
          <CreateBudgetModal
            categories={categories}
            trigger={
              <Button variant="premium">
                New Budget
              </Button>
            }
          />
        </CardHeader>

        <CardContent className={dataCardContentClass}>
          <Table>
            <TableHeader>
              <TableRow className={dataTableHeaderRowClass}>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4}>
                    <TableEmptyState
                      icon={PiggyBank}
                      message="No budgets defined yet."
                      description="Set income targets and expense limits by category to track your progress on the dashboard."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium text-slate-800">
                      {budget.category}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={budget.type} />
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        budget.type === "income"
                          ? incomeAmountClass
                          : expenseAmountClass
                      }`}
                    >
                      {formatCurrency(parseFloat(budget.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <BudgetActionButtons
                        budget={budget}
                        categories={categories}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
