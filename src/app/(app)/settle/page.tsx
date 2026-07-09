import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettleCard } from "@/components/settle-card";
import { getBalance, getProfiles, getSettlements } from "@/lib/data";
import { formatAmount, formatDate } from "@/lib/format";

export default async function SettlePage() {
  const [balance, settlements, profiles] = await Promise.all([
    getBalance(),
    getSettlements(),
    getProfiles(),
  ]);

  function profileName(id: string) {
    return profiles.find((p) => p.id === id)?.display_name ?? "?";
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Règlement</h1>
        <p className="text-sm text-muted-foreground">Qui doit combien à qui, en ce moment.</p>
      </div>

      <SettleCard net={balance.net} profiles={balance.profiles} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {settlements.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun règlement pour l&apos;instant.
            </p>
          ) : (
            settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {profileName(s.from_user)} → {profileName(s.to_user)}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {formatAmount(s.amount)} · {formatDate(s.date)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
