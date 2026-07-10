import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyFlowCard } from "@/components/money-flow-card";
import { PocketManager } from "@/components/pocket-manager";
import { getMonthIncome, getPockets } from "@/lib/data";

export default async function FluxArgentPage() {
  const [{ sources, total, byPocket }, pockets] = await Promise.all([getMonthIncome(), getPockets()]);

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
        incomeByPocket={byPocket}
        pockets={pockets}
        showEditLink={false}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifier la répartition automatique</CardTitle>
        </CardHeader>
        <CardContent>
          <PocketManager pockets={pockets} />
        </CardContent>
      </Card>
    </div>
  );
}
