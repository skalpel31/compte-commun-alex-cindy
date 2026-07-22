import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekNav } from "@/components/week-nav";
import { ShoppingListItemRow } from "@/components/shopping-list-item-row";
import { AddShoppingItemForm } from "@/components/add-shopping-item-form";
import { RegenerateShoppingListButton } from "@/components/regenerate-shopping-list-button";
import { getShoppingList } from "@/lib/data";
import { getWeekStart } from "@/lib/nutrition";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekStart = weekParam ?? getWeekStart();
  const items = await getShoppingList(weekStart);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Générée à partir du menu de la semaine, complétable à la main.
        </p>
      </div>

      <WeekNav weekStart={weekStart} basePath="/courses" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Liste de courses</CardTitle>
          <RegenerateShoppingListButton weekStart={weekStart} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <AddShoppingItemForm weekStart={weekStart} />
          <div className="flex flex-col divide-y">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Liste vide — génère-la depuis le menu ou ajoute un article.
              </p>
            ) : (
              items.map((item) => <ShoppingListItemRow key={item.id} item={item} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
