export function formatEuro(amount: number, options?: { showSign?: boolean }): string {
  const formatted = formatCurrency(Math.abs(amount));

  if (options?.showSign && amount < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact axis labels for charts (e.g. "84k €"). */
export function formatCurrencyAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const formatted = new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
    }).format(thousands);
    return `${formatted}k €`;
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDisplayDate(date: string): string {
  const [year, month, day] = date.split("T")[0]!.split("-");
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert a Postgres DATE (local-midnight Date) or YYYY-MM-DD string to a
 * calendar date string without UTC shifting.
 */
export function toDateOnlyString(value: Date | string): string {
  if (typeof value === "string") {
    return value.split("T")[0]!;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Validate and return YYYY-MM-DD for Postgres DATE columns. */
export function normalizeDateInput(date: string): string {
  const dateOnly = date.split("T")[0]!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  const [year, month, day] = dateOnly.split("-").map(Number);
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    throw new Error("Invalid date.");
  }

  return dateOnly;
}

/** YYYY-MM-DD in the runtime's local timezone (for due-date comparisons). */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Default create date: today when it falls in the viewed month, otherwise the 1st of that month. */
export function getDefaultTransactionDateForViewedMonth(
  viewedYear: number,
  viewedMonth: number,
  referenceDate: Date = new Date()
): string {
  const isViewingCurrentMonth =
    referenceDate.getFullYear() === viewedYear &&
    referenceDate.getMonth() === viewedMonth;

  if (isViewingCurrentMonth) {
    return getLocalDateString(referenceDate);
  }

  return getLocalDateString(new Date(viewedYear, viewedMonth, 1));
}

/**
 * Default due date for a bill created while viewing a budget month:
 * same day-of-month as today when valid, otherwise the last day of that month.
 */
export function getDefaultDueDateForViewedMonth(
  viewedYear: number,
  viewedMonth: number,
  referenceDate: Date = new Date()
): string {
  const dayOfMonth = referenceDate.getDate();
  const lastDayOfViewedMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
  const clampedDay = Math.min(dayOfMonth, lastDayOfViewedMonth);

  return getLocalDateString(new Date(viewedYear, viewedMonth, clampedDay));
}
