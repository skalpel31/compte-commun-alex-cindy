import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPocketSheet } from "@/components/pocket-manager";
import { DeletePocketButton } from "@/components/delete-pocket-button";
import { CategoryIcon, categoryBg, categoryText, nextPocketColor } from "@/lib/category-style";
import { getGoals, getPocketBalances, getProfiles, getSavingsBillTotals } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function EpargnePage() {
  const [pockets, goals, profiles, savingsBills] = await Promise.all([
    getPocketBalances(),
    getGoals(),
    getProfiles(),
    getSavingsBillTotals(),
  ]);
  const savingsPockets = pockets.filter((p) => p.is_savings);
  const linkedGoals = goals.filter((g) => savingsPockets.some((p) => p.id === g.pocket_id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Épargne</h1>
        <p className="text-sm text-muted-foreground">
          Ce que vous mettez de côté, compte par compte — chacun a son propre total, ils ne
          s&apos;additionnent pas entre eux.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vos comptes épargne</CardTitle>
          <NewPocketSheet nextColor={nextPocketColor(pockets)} profiles={profiles} isSavings />
        </CardHeader>
        <CardContent className="divide-y">
          {savingsPockets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun compte épargne pour l&apos;instant — crée-en un ci-dessus (Épargne commune,
              Livret Mila...).
            </p>
          ) : (
            savingsPockets.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <Link href={`/epargne/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}
                  >
                    <CategoryIcon icon={p.icon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className={`text-sm font-semibold tabular-nums ${categoryText(p.color)}`}>
                      {formatAmount(p.balance)}
                    </p>
                  </div>
                </Link>
                <DeletePocketButton pocketId={p.id} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vos versements réguliers</CardTitle>
          <p className="text-xs text-muted-foreground">
            Livret A, PEL... des factures récurrentes vers un compte externe. Chacun a son propre
            total versé à ce jour.
          </p>
        </CardHeader>
        <CardContent className="divide-y">
          {savingsBills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun versement régulier pour l&apos;instant — ajoute une facture dans la catégorie
              Épargne (ex : Livret A Mila).
            </p>
          ) : (
            savingsBills.map((b) => (
              <Link
                key={b.billId}
                href={`/epargne/bill/${b.billId}`}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PiggyBank className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.billName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(b.monthlyAmount)}/mois · {b.paymentsCount} versement
                    {b.paymentsCount > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatAmount(b.totalPaid)}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectifs liés à l&apos;épargne</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {linkedGoals.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun objectif lié pour l&apos;instant — crée-en un depuis la page Objectifs.
            </p>
          ) : (
            linkedGoals.map((g) => {
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
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
