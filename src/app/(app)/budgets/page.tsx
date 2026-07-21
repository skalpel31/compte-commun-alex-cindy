import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetRow } from "@/components/budget-row";
import { NewBudgetSheet } from "@/components/new-budget-sheet";
import { GoalsSection } from "@/components/goals-section";
import {
  getBudgets,
  getGoals,
  getCategories,
  getMonthTransactions,
  getPockets,
  getRollingBudgetAvailable,
  getBills,
} from "@/lib/data";

export default async function BudgetsPage() {
  const [categories, budgets, monthTransactions, goals, pockets, bills] = await Promise.all([
    getCategories(),
    getBudgets(),
    getMonthTransactions(),
    getGoals(),
    getPockets(),
    getBills(),
  ]);

  const spendByCategory = new Map<string, number>();
  for (const t of monthTransactions) {
    if (!t.category_id || t.category?.type !== "expense") continue;
    spendByCategory.set(t.category_id, (spendByCategory.get(t.category_id) ?? 0) + t.amount);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const rolloverCategoryIds = expenseCategories.filter((c) => c.budget_rollover).map((c) => c.id);
  const rollingAvailable = await getRollingBudgetAvailable(rolloverCategoryIds);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Calculé automatiquement depuis tes factures, ou à définir toi-même.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ce mois-ci</CardTitle>
          <NewBudgetSheet />
        </CardHeader>
        <CardContent className="divide-y">
          {expenseCategories.map((category) => {
            const budget = budgets.find((b) => b.category_id === category.id);
            const rolling = rollingAvailable[category.id];
            const categoryBills = bills.filter((b) => b.category_id === category.id);
            // Rollover categories compare against the CUMULATIVE total/spend
            // since the budget started, not just this month's — otherwise a
            // fully-used rollover budget computes to 0 available and gets
            // mistaken for "no budget set" (0 is a legitimate value here).
            const limit = rolling ? rolling.cumulativeTotal : (budget?.amount_limit ?? null);
            const spent = rolling ? rolling.cumulativeSpent : (spendByCategory.get(category.id) ?? 0);
            return (
              <BudgetRow
                key={category.id}
                category={category}
                budgetId={budget?.id ?? null}
                limit={limit}
                baseLimit={budget?.amount_limit ?? null}
                spent={spent}
                available={rolling?.available}
                auto={budget?.auto ?? false}
                bills={categoryBills}
              />
            );
          })}
        </CardContent>
      </Card>

      <GoalsSection goals={goals} pockets={pockets} />
    </div>
  );
}
