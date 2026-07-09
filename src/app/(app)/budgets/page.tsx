import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetRow } from "@/components/budget-row";
import { GoalsSection } from "@/components/goals-section";
import { getBudgets, getGoals, getCategories, getMonthTransactions } from "@/lib/data";

export default async function BudgetsPage() {
  const [categories, budgets, monthTransactions, goals] = await Promise.all([
    getCategories(),
    getBudgets(),
    getMonthTransactions(),
    getGoals(),
  ]);

  const spendByCategory = new Map<string, number>();
  for (const t of monthTransactions) {
    if (!t.category_id || t.category?.type !== "expense") continue;
    spendByCategory.set(t.category_id, (spendByCategory.get(t.category_id) ?? 0) + t.amount);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Calculé automatiquement depuis tes factures, ou à définir toi-même.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ce mois-ci</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {expenseCategories.map((category) => {
            const budget = budgets.find((b) => b.category_id === category.id);
            return (
              <BudgetRow
                key={category.id}
                category={category}
                budgetId={budget?.id ?? null}
                limit={budget?.amount_limit ?? null}
                spent={spendByCategory.get(category.id) ?? 0}
                auto={budget?.auto ?? false}
              />
            );
          })}
        </CardContent>
      </Card>

      <GoalsSection goals={goals} />
    </div>
  );
}
