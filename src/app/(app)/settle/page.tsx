import { ContributionView } from "@/components/contribution-view";
import { getContributions } from "@/lib/data";

export default async function SettlePage() {
  const { contributions, total } = await getContributions();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contributions</h1>
        <p className="text-sm text-muted-foreground">
          Qui a payé quoi pour le compte commun ce mois-ci.
        </p>
      </div>

      <ContributionView contributions={contributions} total={total} />
    </div>
  );
}
