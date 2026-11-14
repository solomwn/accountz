import { pool } from "../../db";

export type AccountType = "asset" | "liability";

const VALID_ACCOUNT_TYPES = new Set<AccountType>(["asset", "liability"]);

const columnExistenceCache = new Map<string, boolean>();
let accountTypeSupportCache: boolean | null = null;

export function normalizeAccountType(value: unknown): AccountType {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (VALID_ACCOUNT_TYPES.has(normalized as AccountType)) {
      return normalized as AccountType;
    }
  }
  return "asset";
}

export async function hasColumn(
  table: string,
  column: string
): Promise<boolean> {
  const cacheKey = `${table}.${column}`;
  const cached = columnExistenceCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [table, column]
  );

  const exists = (result.rowCount ?? 0) > 0;
  columnExistenceCache.set(cacheKey, exists);
  return exists;
}

export async function supportsAccountType(): Promise<boolean> {
  if (accountTypeSupportCache !== null) {
    return accountTypeSupportCache;
  }

  accountTypeSupportCache = await hasColumn("accounts", "account_type");
  if (!accountTypeSupportCache) {
    console.info(
      "[schema-compat] accounts.account_type is unavailable; using legacy account schema defaults."
    );
  }
  return accountTypeSupportCache;
}
