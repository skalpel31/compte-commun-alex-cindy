import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { PocketManager } from "@/components/pocket-manager";
import { IncomeScheduleManager } from "@/components/income-schedule-manager";
import { RecalculateIncomeButton } from "@/components/recalculate-income-button";
import { getCategories, getIncomeSchedules, getMonthIncome, getPockets, getProfiles } from "@/lib/data";
import { nextOccurrenceOnOrAfter } from "@/lib/income-forecast";
import { formatAmount, formatDate, localDateString } from "@/lib/format";
import { payerLabel } from "@/lib/payer";

export default async function FluxArgentPage() {
  const [{ sources, total, byPayerPocket }, pockets, categories, profiles, schedules] = await Promise.all([
    getMonthIncome(),
    getPockets(),
    getCategories(),
    getProfiles(),
    getIncomeSchedules(),
  ]);
  const otherIncomeCategoryId = categories.find((c) => c.name === "Autres revenus")?.id;

  const upcoming = schedules
    .filter((s) => s.active)
    .map((s) => ({ schedule: s, next: nextOccurrenceOnOrAfter(s, new Date()) }))
    .sort((a, b) => a.next.getTime() - b.next.getTime());

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Flux d&apos;argent</h1>
        <p className="text-sm text-muted-foreground">
          D&apos;où vient l&apos;argent du foyer, et où il va automatiquement.
        </p>
      </div>

      <MoneyFlowCard
        incomeSources={sources}
        incomeTotal={total}
        byPayerPocket={byPayerPocket}
        pockets={pockets}
        profiles={profiles}
        otherIncomeCategoryId={otherIncomeCategoryId}
        showEditLink={false}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenus attendus</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Déclare les revenus qui reviennent régulièrement (salaire en plusieurs fois, indemnités...)
            pour voir venir les prochains versements et savoir si tes factures passeront.
          </p>
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">Prochains versements attendus</p>
              {upcoming.map(({ schedule, next }) => (
                <div key={schedule.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {schedule.label} · {payerLabel(schedule.payer_id, profiles)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDate(localDateString(next))}
                    {schedule.amount_estimate != null && ` · ~${formatAmount(schedule.amount_estimate)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <IncomeScheduleManager schedules={schedules} profiles={profiles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Modifier la répartition automatique</CardTitle>
          <RecalculateIncomeButton />
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Changer les % ci-dessous ne modifie que les prochains revenus — utilise
            &quot;Recalculer ce mois&quot; pour appliquer les nouveaux % aux revenus déjà entrés ce mois-ci.
          </p>
          <PocketManager pockets={pockets} />
        </CardContent>
      </Card>
    </div>
  );
}
