import { getReportData, getYearlyMatrixData } from "@/app/actions";
import { ReportsView } from "@/components/reports/reports-view";

interface ReportsPageProps {
  searchParams?: {
    month?: string;
    year?: string;
    view?: string;
  };
}

function parseMonthYear(searchParams?: ReportsPageProps["searchParams"]) {
  const now = new Date();
  const month = searchParams?.month
    ? Math.min(12, Math.max(1, parseInt(searchParams.month, 10)))
    : now.getMonth() + 1;
  const year = searchParams?.year
    ? parseInt(searchParams.year, 10)
    : now.getFullYear();

  return {
    month: Number.isNaN(month) ? now.getMonth() + 1 : month,
    year: Number.isNaN(year) ? now.getFullYear() : year,
  };
}

function parseReportView(viewParam?: string) {
  if (viewParam === "yearly-category") return "yearly-category" as const;
  if (viewParam === "yearly-group" || viewParam === "yearly") {
    return "yearly-group" as const;
  }
  return "monthly" as const;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { month, year } = parseMonthYear(searchParams);
  const view = parseReportView(searchParams?.view);
  const isYearlyMatrix =
    view === "yearly-group" || view === "yearly-category";

  const [data, yearlyMatrixData] = await Promise.all([
    view === "monthly" ? getReportData(month, year) : Promise.resolve(null),
    isYearlyMatrix ? getYearlyMatrixData(year) : Promise.resolve(null),
  ]);

  return (
    <div className="-mx-4 min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 py-4 sm:py-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
      <ReportsView
        data={data}
        yearlyMatrixData={yearlyMatrixData}
        view={view}
        month={month}
        year={year}
      />
    </div>
  );
}
