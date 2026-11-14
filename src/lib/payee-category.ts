import type { RecentPayee } from "@/app/actions";

/** Same normalization used for transaction payee matching. */
export function normalizePayeeDescription(description: string): string {
  return description.trim().toLowerCase();
}

export function findCategoryIdForPayeeDescription(
  description: string,
  recentPayees: RecentPayee[]
): string | undefined {
  const normalized = normalizePayeeDescription(description);
  if (!normalized) {
    return undefined;
  }

  return recentPayees.find(
    (payee) => normalizePayeeDescription(payee.description) === normalized
  )?.categoryId;
}
