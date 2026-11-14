import type { Category } from "@/app/actions";

export function filterCategoriesByType(
  categories: Category[],
  type: "income" | "expense"
): Category[] {
  return categories.filter((category) => category.type === type);
}

export function getDefaultCategoryId(
  categories: Category[],
  type: "income" | "expense"
): string {
  return filterCategoriesByType(categories, type)[0]?.id ?? "";
}
