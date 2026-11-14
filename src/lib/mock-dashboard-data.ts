export const MOCK_USER = {
  name: "Alex",
  initials: "A",
};

export const MOCK_INCOME = {
  earnedThisMonth: 4250,
  monthlyTarget: 5000,
};

export const MOCK_EXPENSES = {
  spent: 3180,
  monthlyBudget: 4000,
};

export const MOCK_CASH_FLOW = {
  startingBalance: 12450,
  totalIncome: 48200,
  totalExpenses: 35680,
  currentBalance: 24970,
  monthlyData: [
    { month: "Jan", balance: 12450 },
    { month: "Feb", balance: 13120 },
    { month: "Mar", balance: 13890 },
    { month: "Apr", balance: 14200 },
    { month: "May", balance: 15680 },
    { month: "Jun", balance: 16340 },
    { month: "Jul", balance: 17820 },
    { month: "Aug", balance: 18560 },
    { month: "Sep", balance: 20100 },
    { month: "Oct", balance: 21450 },
    { month: "Nov", balance: 23200 },
    { month: "Dec", balance: 24970 },
  ],
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
