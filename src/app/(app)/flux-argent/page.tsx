import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { PocketManager } from "@/components/pocket-manager";
import { RecalculateIncomeButton } from "@/components/recalculate-income-button";
import { getCategories, getMonthIncome, getPockets, getProfiles } from "@/lib/data";

export default async function FluxArgentPage() {
  const [{ sources, total, byPayerPocket }, pockets, categories, profiles] = await Promise.all([
    getMonthIncome(),
    getPockets(),
    getCategories(),
    getProfiles(),
  ]);
  const otherIncomeCategoryId = categories.find((c) => c.name === "Autres revenus")?.id;

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
