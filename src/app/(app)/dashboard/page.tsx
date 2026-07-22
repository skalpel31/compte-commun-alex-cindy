import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Receipt,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { TransferInstructionsCard } from "@/components/transfer-instructions-card";
import { AdvisorCard, type AdvisorItem } from "@/components/advisor-card";
import { PocketUsageDonut } from "@/components/pocket-usage-donut";
import { RecentExpensesTable } from "@/components/recent-expenses-table";
import { SmartAlertCard } from "@/components/smart-alert-card";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import {
  computePlannedSpend,
  getBills,
  getBudgets,
  getCategories,
  getCurrentProfile,
  getGoals,
  getMonthIncome,
  getMonthTransactions,
  getPocketBalances,
  getProfiles,
  getTransactions,
} from "@/lib/data";
import { formatAmount, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const [
    monthTransactions,
    recent,
    bills,
    goals,
    pockets,
    currentProfile,
    { sources: incomeSources, total: incomeTotal, byPayerPocket },
    categories,
    profiles,
    budgets,
  ] = await Promise.all([
    getMonthTransactions(),
    getTransactions(6),
    getBills(),
    getGoals(),
    getPocketBalances(),
    getCurrentProfile(),
    getMonthIncome(),
    getCategories(),
    getProfiles(),
    getBudgets(),
  ]);

  const pendingBills = bills.filter((bill) => bill.status !== "paid");
  const jointPocket = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  const jointUpcoming = jointPocket
    ? pendingBills.filter((b) => b.pocket_id === jointPocket.id).reduce((s, b) => s + b.effectiveAmount, 0)
    : 0;
  const jointProjected = jointPocket ? jointPocket.balance - jointUpcoming : null;
  const lowBalanceAlert =
    jointPocket && jointProjected !== null && jointProjected < 500 && jointUpcoming > 0;

  // Same pocket-resolution rule as when a bill actually gets paid (its own
  // pocket_id, falling back to its category's default) — so "who owes how
  // much fixed" lines up with where the money will actually come from.
  const fixedChargesByPocket = new Map<string, number>();
  for (const b of bills) {
    const pocketId = b.pocket_id ?? b.category?.default_pocket_id ?? null;
    if (!pocketId) continue;
    fixedChargesByPocket.set(pocketId, (fixedChargesByPocket.get(pocketId) ?? 0) + b.effectiveAmount);
  }

  const planned = computePlannedSpend(bills, budgets);
  const totalFixedCharges = planned.fixedCharges;
  const manualBudgets = planned.discretionaryBudgets;
  const totalFixedExpenses = planned.discretionaryTotal;

  const negativePockets = pockets.filter((p) => p.balance < 0);
  const overdueBills = pendingBills.filter((b) => b.status === "overdue");

  let householdStatus: "good" | "warning" | "critical" = "good";
  let householdHeadline = "L'organisation du foyer est ok.";
  let householdDetail: string | null = null;

  if (negativePockets.length > 0) {
    householdStatus = "critical";
    householdHeadline =
      negativePockets.length > 1
        ? `${negativePockets.length} comptes sont dans le rouge.`
        : "Un compte est dans le rouge.";
    householdDetail = negativePockets
      .map((p) => `${p.name} (${formatAmount(p.balance)})`)
      .join(" · ");
  } else if (overdueBills.length > 0) {
    householdStatus = "critical";
    householdHeadline = `${overdueBills.length} facture${overdueBills.length > 1 ? "s" : ""} en retard.`;
    householdDetail = `${overdueBills[0].name} devait être payée le ${formatDate(overdueBills[0].dueDate)}.`;
  } else if (lowBalanceAlert) {
    householdStatus = "warning";
    householdHeadline = "Le compte joint va être serré.";
    householdDetail = `${jointPocket!.name} passera à ${formatAmount(jointProjected!)} après les prélèvements à venir.`;
  }

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

  const advisorItems: AdvisorItem[] = [
    {
      icon: Receipt,
      tone: "info",
      text: `Vous avez dépensé ${formatAmount(monthSpend)} au total sur l'argent du foyer ce mois-ci.`,
      actionLabel: "Voir le détail",
      actionHref: "/transactions",
    },
  ];
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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {greeting}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {currentProfile?.display_name ?? ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {todayLabel} · Tout votre argent, organisé pour vos objectifs de vie.
        </p>
      </div>

      <Card
        className={`glass ${
          householdStatus === "critical"
            ? "border-critical/30"
            : householdStatus === "warning"
              ? "border-warning/30"
              : "border-good/30"
        }`}
      >
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                householdStatus === "critical"
                  ? "bg-critical/10 text-critical"
                  : householdStatus === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-good/10 text-good"
              }`}
            >
              {householdStatus === "good" ? (
                <CircleCheck className="size-4" />
              ) : (
                <TriangleAlert className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  householdStatus === "critical"
                    ? "text-critical"
                    : householdStatus === "warning"
                      ? "text-warning"
                      : "text-good"
                }`}
              >
                {householdHeadline}
              </p>
              {householdDetail && (
                <p className="text-xs text-muted-foreground">{householdDetail}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pockets.map((p) => (
              <div
                key={p.id}
                className="flex w-32 shrink-0 flex-col gap-1 rounded-xl border p-2"
              >
                <div className={`flex size-5 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
                  <CategoryIcon icon={p.icon} className="size-3" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.65rem] leading-tight text-muted-foreground">{p.name}</p>
                  <p className={`truncate text-sm font-semibold tabular-nums ${categoryText(p.color)}`}>
                    {formatAmount(p.balance)}
                  </p>
                  <p className="truncate text-[0.62rem] leading-tight text-muted-foreground">
                    reste · dépensé {formatAmount(p.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <MoneyFlowCard
          incomeSources={incomeSources}
          incomeTotal={incomeTotal}
          byPayerPocket={byPayerPocket}
          pockets={pockets}
          profiles={profiles}
          otherIncomeCategoryId={categories.find((c) => c.name === "Autres revenus")?.id}
        />
        <TransferInstructionsCard profiles={profiles} pockets={pockets} incomeSources={incomeSources} />
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
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Charges fixes du foyer</p>
                <p className="text-xl font-semibold tabular-nums">{formatAmount(totalFixedCharges)}</p>
              </div>
              <Link href="/bills" className="text-xs text-muted-foreground hover:underline">
                Voir le détail
              </Link>
            </div>
            {fixedChargesByPocket.size > 0 && (
              <div className="flex flex-col gap-1 border-t pt-2">
                {pockets
                  .filter((p) => fixedChargesByPocket.has(p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Charges fixes {p.name}</span>
                      <span className="font-medium tabular-nums">
                        {formatAmount(fixedChargesByPocket.get(p.id)!)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {manualBudgets.length > 0 && (
              <div className="flex flex-col gap-1 border-t pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Dépenses fixes</span>
                  <span className="font-medium tabular-nums">{formatAmount(totalFixedExpenses)}</span>
                </div>
                {manualBudgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between pl-3 text-xs">
                    <span className="text-muted-foreground">{b.category?.name}</span>
                    <span className="font-medium tabular-nums">{formatAmount(b.amount_limit)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="font-medium">Total prévu ce mois</span>
              <span className="font-semibold tabular-nums">{formatAmount(planned.total)}</span>
            </div>
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
