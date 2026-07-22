import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetRow } from "@/components/budget-row";
import { NewBudgetSheet } from "@/components/new-budget-sheet";
import { GoalsSection } from "@/components/goals-section";
import { MonthNav } from "@/components/month-nav";
import { PocketUsageDonut } from "@/components/pocket-usage-donut";
import { TrendChart } from "@/components/trend-chart";
import {
  getBudgets,
  getGoals,
  getCategories,
  getMonthTransactions,
  getMonthlySpend,
  getPockets,
  getProfiles,
  getRollingBudgetAvailable,
  getBills,
} from "@/lib/data";
import { currentMonth } from "@/lib/format";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();

  const [categories, budgets, monthTransactions, goals, pockets, bills, profiles, monthlySpend] =
    await Promise.all([
      getCategories(),
      getBudgets(month),
      getMonthTransactions(month),
      getGoals(),
      getPockets(),
      getBills(),
      getProfiles(),
      getMonthlySpend(6),
    ]);

  const spendByCategory = new Map<string, number>();
  for (const t of monthTransactions) {
    if (!t.category_id || t.category?.type !== "expense") continue;
    spendByCategory.set(t.category_id, (spendByCategory.get(t.category_id) ?? 0) + t.amount);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const rolloverCategoryIds = expenseCategories.filter((c) => c.budget_rollover).map((c) => c.id);
  const rollingAvailable = await getRollingBudgetAvailable(rolloverCategoryIds, month);

  const monthSpend = Array.from(spendByCategory.values()).reduce((s, v) => s + v, 0);
  const usageByCategory = expenseCategories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon ?? "circle",
    color: c.color ?? "chart-1",
    spent: spendByCategory.get(c.id) ?? 0,
  }));

  const sharedCategories: typeof expenseCategories = [];
  const personalCategories = new Map<string, typeof expenseCategories>();
  for (const category of expenseCategories) {
    const budget = budgets.find((b) => b.category_id === category.id);
    if (budget?.scope === "personal" && budget.user_id) {
      const list = personalCategories.get(budget.user_id) ?? [];
      list.push(category);
      personalCategories.set(budget.user_id, list);
    } else {
      sharedCategories.push(category);
    }
  }

  function renderRow(category: (typeof expenseCategories)[number]) {
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
        month={month}
        profiles={profiles}
        scope={budget?.scope}
        ownerId={budget?.user_id}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Calculé automatiquement depuis tes factures, ou à définir toi-même.
        </p>
      </div>

      <MonthNav month={month} basePath="/budgets" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <PocketUsageDonut usage={usageByCategory} total={monthSpend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={monthlySpend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Communs</CardTitle>
          <NewBudgetSheet profiles={profiles} month={month} />
        </CardHeader>
        <CardContent className="divide-y">{sharedCategories.map(renderRow)}</CardContent>
      </Card>

      {profiles.map((profile) => {
        const list = personalCategories.get(profile.id);
        if (!list || list.length === 0) return null;
        return (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle className="text-base">Personnel — {profile.display_name}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">{list.map(renderRow)}</CardContent>
          </Card>
        );
      })}

      <GoalsSection goals={goals} pockets={pockets} />
    </div>
  );
}
