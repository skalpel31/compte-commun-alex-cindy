import Link from "next/link";
import { ArrowRight, CircleAlert, Clock, FileText, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBars } from "@/components/category-bars";
import { TrendChart } from "@/components/trend-chart";
import { TransactionRow } from "@/components/transaction-row";
import { PocketCards } from "@/components/pocket-cards";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { PocketUsageDonut } from "@/components/pocket-usage-donut";
import { AllocationRules } from "@/components/allocation-rules";
import {
  getBills,
  getCategories,
  getCurrentProfile,
  getGoals,
  getMonthIncome,
  getMonthTransactions,
  getMonthlySpend,
  getPocketBalances,
  getProfiles,
  getTransactions,
} from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function DashboardPage() {
  const [
    monthTransactions,
    monthlySpend,
    recent,
    profiles,
    bills,
    goals,
    pockets,
    currentProfile,
    { sources: incomeSources, total: incomeTotal },
    categories,
  ] = await Promise.all([
    getMonthTransactions(),
    getMonthlySpend(),
    getTransactions(5),
    getProfiles(),
    getBills(),
    getGoals(),
    getPocketBalances(),
    getCurrentProfile(),
    getMonthIncome(),
    getCategories(),
  ]);

  const total = pockets.reduce((sum, p) => sum + p.balance, 0);
  const pendingBills = bills.filter((bill) => bill.status !== "paid");

  const jointPocket = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  const jointUpcoming = jointPocket
    ? pendingBills
        .filter((b) => b.pocket_id === jointPocket.id)
        .reduce((sum, b) => sum + b.amount, 0)
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

  const prevMonths = monthlySpend.slice(0, -1).filter((m) => m.total > 0);
  const avgPrev = prevMonths.length
    ? prevMonths.reduce((s, m) => s + m.total, 0) / prevMonths.length
    : null;
  const savingsOpportunity =
    avgPrev !== null && monthSpend < avgPrev ? avgPrev - monthSpend : null;

  const insights: { icon: typeof TrendingUp; text: string }[] = [];
  if (savingsOpportunity && savingsOpportunity > 10) {
    insights.push({
      icon: TrendingUp,
      text: `Tu dépenses ${formatAmount(savingsOpportunity)} de moins que d'habitude ce mois-ci — l'occasion d'épargner la différence.`,
    });
  }
  const overdueBills = pendingBills.filter((b) => b.status === "overdue");
  if (overdueBills.length > 0) {
    insights.push({
      icon: CircleAlert,
      text: `${overdueBills.length} facture${overdueBills.length > 1 ? "s" : ""} en retard : ${overdueBills.map((b) => b.name).join(", ")}.`,
    });
  } else if (pendingBills.filter((b) => b.status === "upcoming").length > 0) {
    const upcoming = pendingBills.filter((b) => b.status === "upcoming");
    insights.push({
      icon: Clock,
      text: `${upcoming.length} prélèvement${upcoming.length > 1 ? "s" : ""} important${upcoming.length > 1 ? "s" : ""} à venir (${formatAmount(upcoming.reduce((s, b) => s + b.amount, 0))}).`,
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {currentProfile?.display_name ?? ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Tout votre argent, organisé pour vos objectifs de vie.
        </p>
      </div>

      <MoneyFlowCard incomeSources={incomeSources} incomeTotal={incomeTotal} pockets={pockets} />

      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Vos comptes · Solde total{" "}
          <span className="font-medium text-foreground">{formatAmount(total)}</span>
        </p>
        <PocketCards pockets={pockets} />
      </div>

      {lowBalanceAlert && jointPocket && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium">
                {jointPocket.name} passera à {formatAmount(jointProjected!)} après les prélèvements
                à venir
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(jointUpcoming)} de factures pas encore payées sur cette poche.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {insights.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p>{insight.text}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {goals.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Objectifs en cours</CardTitle>
              <Link href="/budgets" className="text-xs text-muted-foreground hover:underline">
                Voir tous
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {goals.slice(0, 4).map((g) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                return (
                  <div key={g.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{g.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatAmount(g.current_amount)} / {formatAmount(g.target_amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-5"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {pendingBills.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines factures</CardTitle>
            <Link href="/bills" className="text-xs text-muted-foreground hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="divide-y">
            {pendingBills.slice(0, 3).map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 py-2">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    bill.status === "overdue" ? "bg-critical/10" : "bg-warning/10"
                  }`}
                >
                  {bill.status === "overdue" ? (
                    <CircleAlert className="size-4 text-critical" />
                  ) : (
                    <Clock className="size-4 text-warning" />
                  )}
                </div>
                <span className="flex-1 truncate text-sm">{bill.name}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatAmount(bill.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilisation des comptes</CardTitle>
          </CardHeader>
          <CardContent>
            <PocketUsageDonut usage={usageByPocket} total={monthSpend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Règles de répartition</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationRules categories={categories} pockets={pockets} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendance sur 6 mois</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={monthlySpend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dépenses par catégorie ce mois-ci</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBars transactions={monthTransactions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dernières transactions</CardTitle>
          <Link href="/transactions" className="text-xs text-muted-foreground hover:underline">
            Tout voir
          </Link>
        </CardHeader>
        <CardContent className="divide-y">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <FileText className="size-6 text-muted-foreground/50" />
              Aucune transaction pour le moment.
            </div>
          ) : (
            recent.map((t) => <TransactionRow key={t.id} transaction={t} profiles={profiles} />)
          )}
        </CardContent>
      </Card>

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
