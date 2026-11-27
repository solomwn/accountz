"use client";

import type { AccountBalance } from "@/app/actions";
import { AccountActionButtons } from "@/components/accounts/account-action-buttons";
import { formatCurrency, formatDisplayDate, getLocalDateString } from "@/lib/format";

interface YearMonthDay {
  y: number;
  m: number; // 1-12
  d: number;
}

function parseDate(value: string | null): YearMonthDay | null {
  if (!value) return null;
  const [y, m, d] = value.split("T")[0]!.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function addMonths(date: YearMonthDay, months: number, dayOfMonth: number): YearMonthDay {
  const index = date.y * 12 + (date.m - 1) + months;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  const lastDay = new Date(y, m, 0).getDate();
  return { y, m, d: Math.min(dayOfMonth, lastDay) };
}

function compare(a: YearMonthDay, b: YearMonthDay): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

function toIso({ y, m, d }: YearMonthDay): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Next payment date rolled forward to today or later (so it stays correct
 * without editing it every month), and the number of installments left
 * from that date up to and including the expiry date.
 */
function getSchedule(nextPaymentDate: string | null, endDate: string | null) {
  const start = parseDate(nextPaymentDate);
  const end = parseDate(endDate);
  const today = parseDate(getLocalDateString())!;
  if (!start) return { nextPayment: null, remainingInstallments: null };

  let next = start;
  for (let i = 1; i <= 600 && compare(next, today) < 0; i++) {
    next = addMonths(start, i, start.d);
  }
  if (end && compare(next, end) > 0) {
    return { nextPayment: null, remainingInstallments: 0 };
  }
  if (!end) return { nextPayment: toIso(next), remainingInstallments: null };

  let count = 0;
  let cursor = next;
  const months = (next.y - start.y) * 12 + (next.m - start.m);
  while (compare(cursor, end) <= 0 && count < 600) {
    count++;
    cursor = addMonths(start, months + count, start.d);
  }
  return { nextPayment: toIso(next), remainingInstallments: count };
}

function DetailItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-2 text-lg font-semibold tabular-nums ${
          accent ? "text-[#268ddd]" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function LoanSection({ account }: { account: AccountBalance }) {
  const loan = account.loan!;
  const owed = Math.max(0, -account.currentBalance);
  const initial = loan.initialAmount ? parseFloat(loan.initialAmount) : null;
  const installment = loan.installmentAmount
    ? parseFloat(loan.installmentAmount)
    : null;
  const paidOff = initial !== null ? Math.max(0, initial - owed) : null;
  const percent =
    initial && paidOff !== null ? Math.min(100, (paidOff / initial) * 100) : null;
  const { nextPayment, remainingInstallments } = getSchedule(
    loan.nextPaymentDate,
    loan.endDate
  );
  const remainingToPay =
    installment !== null && remainingInstallments !== null
      ? installment * remainingInstallments
      : null;
  const dash = "—";
  const hasAnyLoanData = Object.values(loan).some((value) => value !== null);

  return (
    <section className="mt-10 border-t border-slate-100 pt-8">
      <h3 className="text-sm font-semibold text-slate-700">Loan details</h3>

      {!hasAnyLoanData ? (
        <p className="mt-2 text-sm text-slate-500">
          Click Edit to add the lender, interest rate, installment and dates.
        </p>
      ) : null}

      {percent !== null && paidOff !== null && initial !== null ? (
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-slate-700">
              Paid off {formatCurrency(paidOff)} of {formatCurrency(initial)}
            </span>
            <span className="font-semibold tabular-nums text-[#268ddd]">
              {percent.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#268ddd]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}

      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Lender" value={loan.lender ?? dash} />
        <DetailItem
          label="Interest Rate"
          value={loan.interestRate ? `${parseFloat(loan.interestRate)}%` : dash}
        />
        <DetailItem
          label="Loan Initial Amount"
          value={initial !== null ? formatCurrency(initial) : dash}
        />
        <DetailItem label="Remaining Balance" value={formatCurrency(owed)} accent />
        <DetailItem
          label="Monthly Installment"
          value={installment !== null ? formatCurrency(installment) : dash}
        />
        <DetailItem
          label="Remaining Installments"
          value={remainingInstallments ?? dash}
        />
        <DetailItem
          label="Next Payment Date"
          value={nextPayment ? formatDisplayDate(nextPayment) : dash}
        />
        <DetailItem
          label="Expiry Date"
          value={loan.endDate ? formatDisplayDate(loan.endDate) : dash}
        />
        <DetailItem
          label="Remaining to Pay (est.)"
          value={remainingToPay !== null ? formatCurrency(remainingToPay) : dash}
        />
        <DetailItem
          label="Principal Paid (recorded)"
          value={formatCurrency(account.transfersInTotal)}
        />
        <DetailItem label="Payments Recorded" value={account.transfersInCount} />
        <DetailItem
          label="Last Payment"
          value={
            account.lastTransferInDate
              ? formatDisplayDate(account.lastTransferInDate)
              : dash
          }
        />
      </dl>
      <p className="mt-4 text-xs text-slate-400">
        Remaining to pay = installments left × monthly installment (includes
        interest). Principal paid counts transfers into this account.
      </p>
    </section>
  );
}

interface AccountDetailsTabProps {
  account: AccountBalance;
  supportsAccountType: boolean;
}

export function AccountDetailsTab({
  account,
  supportsAccountType,
}: AccountDetailsTabProps) {
  return (
    <div className="flex-1 overflow-auto px-5 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{account.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{account.currency}</p>
        </div>
        <AccountActionButtons
          account={account}
          supportsAccountType={supportsAccountType}
        />
      </div>

      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Opening Balance
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
            {formatCurrency(parseFloat(account.openingBalance))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current Balance
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-[#268ddd]">
            {formatCurrency(account.currentBalance)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Alert Limit
          </dt>
          <dd className="mt-2 text-lg font-semibold tabular-nums text-slate-800">
            {formatCurrency(parseFloat(account.alertLimit))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Currency
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-800">
            {account.currency}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Notes
        </dt>
        <dd className="mt-2 text-sm leading-relaxed text-slate-600">
          {account.notes?.trim() ? account.notes : "No notes added for this account."}
        </dd>
      </div>

      {account.accountType === "liability" && account.loan ? (
        <LoanSection account={account} />
      ) : null}
    </div>
  );
}
