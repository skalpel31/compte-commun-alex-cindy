import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount, formatDate } from "@/lib/format";
import { payerLabel } from "@/lib/payer";
import { isSuperAdmin, getHouseholdPreview } from "@/lib/admin";

export default async function AdminHouseholdPreviewPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  if (!(await isSuperAdmin())) notFound();

  const { householdId } = await params;
  const { household, members, pockets, bills, goals, recentTransactions } =
    await getHouseholdPreview(householdId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="size-3.5" />
          Retour
        </Link>
        <Badge variant="outline" className="gap-1">
          <Eye className="size-3" />
          Lecture seule
        </Badge>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{household.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.display_name}</span>
              <span className="text-xs text-muted-foreground">{m.email ?? "Pas de compte"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comptes &amp; soldes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pockets.map((p) => (
            <div key={p.id} className="flex flex-col gap-1 rounded-xl border p-2">
              <div className={`flex size-6 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
                <CategoryIcon icon={p.icon} className="size-3.5" />
              </div>
              <p className="truncate text-xs text-muted-foreground">{p.name}</p>
              <p className="truncate text-sm font-semibold tabular-nums">{formatAmount(p.balance)}</p>
            </div>
          ))}
          {pockets.length === 0 && <p className="text-sm text-muted-foreground">Aucun compte.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Factures actives</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {bills.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {payerLabel(b.default_payer, members)} · le {b.due_day}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{formatAmount(b.effectiveAmount)}</span>
                <Badge
                  variant={
                    b.status === "paid" ? "secondary" : b.status === "overdue" ? "destructive" : "outline"
                  }
                >
                  {b.status}
                </Badge>
              </div>
            </div>
          ))}
          {bills.length === 0 && <p className="text-sm text-muted-foreground">Aucune facture active.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectifs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-sm">
              <span>{g.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatAmount(g.current_amount)} / {formatAmount(g.target_amount)}
              </span>
            </div>
          ))}
          {goals.length === 0 && <p className="text-sm text-muted-foreground">Aucun objectif.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentTransactions.map((t) => {
            const isIncome = t.category?.type === "income";
            return (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(t.category?.color ?? null)}`}>
                  <CategoryIcon icon={t.category?.icon ?? null} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.description || t.category?.name || "Sans description"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(t.date)} · {payerLabel(t.paid_by, members)}
                  </p>
                </div>
                <span className={`shrink-0 font-semibold tabular-nums ${isIncome ? "text-good" : ""}`}>
                  {isIncome ? "+" : "-"}
                  {formatAmount(t.amount)}
                </span>
              </div>
            );
          })}
          {recentTransactions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune transaction.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
