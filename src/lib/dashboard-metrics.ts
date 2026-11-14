/**
 * Month-over-month percent change for subtitle text.
 *
 * Formula: ((current - previous) / |previous|) * 100
 * Returns null when previous is 0 (no prior-month baseline).
 */
export function getMonthOverMonthChangePercent(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Segmented bar fill for income, expenses, and net savings.
 *
 * Compares current month to previous month as a ratio:
 *   fill = (current / previous) * 100, capped at 100
 *
 * When previous month is 0, returns 100 as the baseline fill.
 */
export function getMonthOverMonthBarFill(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, (current / previous) * 100));
}

/**
 * Segmented bar fill for the budgets card.
 *
 * Formula: (totalPaid / totalPlanned) * 100, capped at 100
 *
 * When totalPlanned is 0, returns 100 as the baseline fill.
 */
export function getBudgetBarFill(paid: number, planned: number): number {
  if (planned === 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, (paid / planned) * 100));
}
