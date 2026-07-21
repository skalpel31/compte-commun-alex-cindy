import { ArrowRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/format";
import { computeIncomeSplit } from "@/lib/income-split";
import type { IncomeSource } from "@/lib/data";
import type { Pocket, Profile } from "@/lib/types";

function colorVar(color: string): string {
  return `var(--${color})`;
}

export function TransferInstructionsCard({
  profiles,
  pockets,
  incomeSources,
}: {
  profiles: Profile[];
  pockets: Pocket[];
  incomeSources: IncomeSource[];
}) {
  const payers = profiles
    .map((profile) => {
      const source = incomeSources.find((s) => s.paidBy === profile.id);
      const amount = source?.amount ?? 0;
      const split = computeIncomeSplit(pockets, profile.id, amount);
      const rows = split
        .map((s) => ({ pocket: pockets.find((p) => p.id === s.pocketId), amount: s.amount }))
        .filter((r): r is { pocket: Pocket; amount: number } => !!r.pocket);
      const keep = rows.find((r) => r.pocket.owner_id === profile.id);
      const transfers = rows.filter((r) => r.pocket.owner_id !== profile.id);
      return { profile, amount, keep, transfers };
    })
    .filter((p) => p.amount > 0);

  if (payers.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">À la prochaine paie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ajoute un salaire pour voir combien virer où.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">À la prochaine paie</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {payers.map(({ profile, amount, keep, transfers }) => (
          <div key={profile.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {profile.display_name} <span className="text-muted-foreground">· {formatAmount(amount)}</span>
            </p>
            <div className="flex flex-col gap-1.5 pl-1">
              {transfers.map((t) => (
                <div key={t.pocket.id} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    Vire vers <span style={{ color: colorVar(t.pocket.color) }}>{t.pocket.name}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{formatAmount(t.amount)}</span>
                </div>
              ))}
              {keep && (
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="size-3.5 shrink-0 text-good" />
                  <span className="min-w-0 flex-1 truncate text-good">Garde sur ton perso</span>
                  <span className="shrink-0 font-semibold tabular-nums text-good">
                    {formatAmount(keep.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
