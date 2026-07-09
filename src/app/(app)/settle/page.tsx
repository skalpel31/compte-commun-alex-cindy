import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContributionView } from "@/components/contribution-view";
import { getBalance, getContributions, getSettlements } from "@/lib/data";
import { formatAmount, formatDate } from "@/lib/format";

export default async function SettlePage() {
  const [{ contributions, totalShared }, balance, settlements] = await Promise.all([
    getContributions(),
    getBalance(),
    getSettlements(),
  ]);

  function profileName(id: string) {
    return balance.profiles.find((p) => p.id === id)?.display_name ?? "?";
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contributions</h1>
        <p className="text-sm text-muted-foreground">
          Ce que chacun a versé pour les dépenses communes ce mois-ci.
        </p>
      </div>

      <ContributionView
        contributions={contributions}
        totalShared={totalShared}
        net={balance.net}
        profiles={balance.profiles}
      />

      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des rééquilibrages</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {profileName(s.from_user)} → {profileName(s.to_user)}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {formatAmount(s.amount)} · {formatDate(s.date)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
