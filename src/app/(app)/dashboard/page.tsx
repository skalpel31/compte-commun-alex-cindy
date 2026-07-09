import Link from "next/link";
import { ArrowRight, CircleAlert, Clock, FileText, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBars } from "@/components/category-bars";
import { TrendChart } from "@/components/trend-chart";
import { TransactionRow } from "@/components/transaction-row";
import {
  getBalance,
  getBills,
  getMonthTransactions,
  getMonthlySpend,
  getProfiles,
  getTransactions,
} from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function DashboardPage() {
  const [monthTransactions, balance, monthlySpend, recent, profiles, bills] = await Promise.all([
    getMonthTransactions(),
    getBalance(),
    getMonthlySpend(),
    getTransactions(5),
    getProfiles(),
    getBills(),
  ]);

  const monthSpend = monthTransactions
    .filter((t) => t.category?.type !== "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const [a, b] = balance.profiles;
  const settled = Math.abs(balance.net) < 0.005;
  let balanceLabel = "Vous êtes à jour";
  if (a && b && balance.net > 0.005) balanceLabel = `${b.display_name} doit à ${a.display_name}`;
  else if (a && b && balance.net < -0.005)
    balanceLabel = `${a.display_name} doit à ${b.display_name}`;

  const pendingBills = bills.filter((bill) => bill.status !== "paid").slice(0, 3);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aperçu</h1>
        <p className="text-sm text-muted-foreground">Le compte commun, en un coup d&apos;œil.</p>
      </div>

      <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground shadow-md">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-white/5"
        />
        <CardContent className="relative flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/70">
            <Scale className="size-3.5" />
            Solde du compte commun
          </span>
          <span className="text-4xl font-semibold tracking-tight tabular-nums">
            {settled ? "À jour" : formatAmount(Math.abs(balance.net))}
          </span>
          <span className="text-sm text-primary-foreground/80">{balanceLabel}</span>
          {!settled && (
            <Link
              href="/settle"
              className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              Régler
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses ce mois-ci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatAmount(monthSpend)}</p>
          </CardContent>
        </Card>
        <Link href="/bills">
          <Card className="h-full transition-shadow hover:shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Factures à payer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {formatAmount(pendingBills.reduce((s, bill) => s + bill.amount, 0))}
              </p>
              {bills.some((bill) => bill.status === "overdue") ? (
                <p className="flex items-center gap-1 text-xs text-critical">
                  <CircleAlert className="size-3" />
                  En retard
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {pendingBills.length} restant{pendingBills.length > 1 ? "es" : "e"}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
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
            {pendingBills.map((bill) => (
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
    </div>
  );
}
