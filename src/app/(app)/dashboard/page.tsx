import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { AccountsCard } from "@/components/accounts-card";
import { AdvisorCard, type AdvisorItem } from "@/components/advisor-card";
import { PocketUsageDonut } from "@/components/pocket-usage-donut";
import { AllocationRules } from "@/components/allocation-rules";
import { RecentExpensesTable } from "@/components/recent-expenses-table";
import { SmartAlertCard } from "@/components/smart-alert-card";
import {
  getBills,
  getCategories,
  getCurrentProfile,
  getGoals,
  getMonthIncome,
  getMonthTransactions,
  getPocketBalances,
  getTransactions,
} from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function DashboardPage() {
  const [
    monthTransactions,
    recent,
    bills,
    goals,
    pockets,
    currentProfile,
    { sources: incomeSources, total: incomeTotal },
    categories,
  ] = await Promise.all([
    getMonthTransactions(),
    getTransactions(6),
    getBills(),
    getGoals(),
    getPocketBalances(),
    getCurrentProfile(),
    getMonthIncome(),
    getCategories(),
  ]);

  const pendingBills = bills.filter((bill) => bill.status !== "paid");
  const jointPocket = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  const jointUpcoming = jointPocket
    ? pendingBills.filter((b) => b.pocket_id === jointPocket.id).reduce((s, b) => s + b.amount, 0)
    : 0;
  const jointProjected = jointPocket ? jointPocket.balance - jointUpcoming : null;
  const lowBalanceAlert =
    jointPocket && jointProjected !== null && jointProjected < 500 && jointUpcoming > 0;

  const monthSpend = monthTransactions
    .filter((t) => t.category?.type !== "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const usageByPocket = pockets.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    color: p.color,
    spent: monthTransactions
      .filter((t) => t.pocket_id === p.id && t.category?.type !== "income")
      .reduce((sum, t) => sum + t.amount, 0),
  }));

  const alertBills = pendingBills
    .filter((b) => b.status === "overdue" || b.status === "upcoming")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const alertHeadline = lowBalanceAlert
    ? `Votre ${jointPocket!.name.toLowerCase()} passera sous 500 € après les prélèvements à venir.`
    : alertBills.length > 0
      ? `${alertBills.length} prélèvement${alertBills.length > 1 ? "s" : ""} à venir sur les prochains jours.`
      : null;

  const misplaced = monthTransactions.filter(
    (t) =>
      t.category?.type === "expense" &&
      t.category?.default_pocket_id &&
      t.pocket_id &&
      t.pocket_id !== t.category.default_pocket_id
  );

  const advisorItems: AdvisorItem[] = [];
  if (jointPocket && jointPocket.balance > 200) {
    const potential = Math.round(jointPocket.balance * 0.1);
    if (potential >= 20) {
      advisorItems.push({
        icon: TrendingUp,
        tone: "good",
        text: `Vous pouvez épargner ${formatAmount(potential)} ce mois-ci sans impacter votre budget.`,
        actionLabel: "Épargner maintenant",
        actionHref: "/epargne",
      });
    }
  }
  if (alertBills.length > 0) {
    const lastDay = new Date(alertBills[alertBills.length - 1].dueDate).getDate();
    advisorItems.push({
      icon: Sparkles,
      tone: "warning",
      text: `${alertBills.length} prélèvement${alertBills.length > 1 ? "s" : ""} important${alertBills.length > 1 ? "s" : ""} à venir d'ici le ${lastDay}.`,
      actionLabel: "Voir le calendrier",
      actionHref: "/alertes",
    });
  }
  if (misplaced.length >= 2) {
    advisorItems.push({
      icon: RefreshCw,
      tone: "info",
      text: "Vous utilisez souvent un compte perso pour des dépenses habituellement communes.",
      actionLabel: "Voir les remboursements",
      actionHref: "/settle",
    });
  }

  const analyzedAt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date()
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {currentProfile?.display_name ?? ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Tout votre argent, organisé pour vos objectifs de vie.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <MoneyFlowCard incomeSources={incomeSources} incomeTotal={incomeTotal} pockets={pockets} />
        <AccountsCard pockets={pockets} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <AdvisorCard items={advisorItems} analyzedAt={analyzedAt} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Objectifs en cours</CardTitle>
            <Link href="/objectifs" className="text-xs text-muted-foreground hover:underline">
              Voir tous
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {goals.length === 0 ? (
              <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Target className="size-4" />
                Aucun objectif pour l&apos;instant.
              </p>
            ) : (
              goals.slice(0, 4).map((g) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                return (
                  <div key={g.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{g.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatAmount(g.current_amount)} / {formatAmount(g.target_amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-5"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs font-medium text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dépenses récentes</CardTitle>
            <Link href="/transactions" className="text-xs text-muted-foreground hover:underline">
              Voir toutes
            </Link>
          </CardHeader>
          <CardContent>
            <RecentExpensesTable transactions={recent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Règles de répartition</CardTitle>
            <Link href="/budgets" className="text-xs text-muted-foreground hover:underline">
              Voir toutes
            </Link>
          </CardHeader>
          <CardContent>
            <AllocationRules categories={categories} pockets={pockets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Utilisation des comptes</CardTitle>
            <span className="text-xs text-muted-foreground">Ce mois-ci</span>
          </CardHeader>
          <CardContent>
            <PocketUsageDonut usage={usageByPocket} total={monthSpend} />
          </CardContent>
        </Card>

        <SmartAlertCard headline={alertHeadline} bills={alertBills} />
      </div>

      <Link
        href="/settle"
        className="flex items-center justify-center gap-1 rounded-xl border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted"
      >
        Qui a payé quoi ce mois-ci
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
