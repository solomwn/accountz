import { FolderOpen } from "lucide-react";
import { getCategories } from "@/app/actions";
import { CategoryActionButtons } from "@/components/categories/category-action-buttons";
import { CreateCategoryModal } from "@/components/categories/create-category-modal";
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
} from "@/lib/premium-data-card";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <Card>
      <CardHeader className={dataCardHeaderClass}>
        <CardTitle className={dataCardTitleClass}>Custom Categories</CardTitle>
        <CreateCategoryModal
          trigger={
            <Button variant="premium">
              New Category
            </Button>
          }
        />
      </CardHeader>

      <CardContent className={dataCardContentClass}>
        <Table>
          <TableHeader>
            <TableRow className={dataTableHeaderRowClass}>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <TableEmptyState
                    icon={FolderOpen}
                    message="No categories recorded yet."
                    description="Create custom income and expense categories with colors for charts and transactions."
                  />
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-slate-800">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={category.type} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-slate-500">
                        {category.color}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryActionButtons category={category} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
