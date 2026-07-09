"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { createSettlement } from "@/lib/actions";
import { formatAmount } from "@/lib/format";
import type { Contribution } from "@/lib/data";
import type { Profile } from "@/lib/types";

function ContributionCard({ contribution, index }: { contribution: Contribution; index: number }) {
  const { profile, target, paid } = contribution;
  const pct = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : paid > 0 ? 100 : 0;
  const color = index === 0 ? "bg-chart-1" : "bg-chart-5";

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
        <ProfileAvatar profile={profile} index={index} size="lg" />
        <span className="text-sm font-medium">{profile.display_name}</span>
        <span className="text-2xl font-semibold tabular-nums">{formatAmount(paid)}</span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${Math.max(paid > 0 ? 4 : 0, pct)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Objectif : {formatAmount(target)} ce mois-ci
        </span>
      </CardContent>
    </Card>
  );
}

export function ContributionView({
  contributions,
  totalShared,
  net,
  profiles,
}: {
  contributions: Contribution[];
  totalShared: number;
  net: number;
  profiles: Profile[];
}) {
  const [pending, startTransition] = useTransition();
  const [a, b] = profiles;
  const settled = Math.abs(net) < 0.005;
  const debtor = net > 0 ? b : a;
  const creditor = net > 0 ? a : b;

  function handleRebalance() {
    if (!debtor || !creditor) return;
    startTransition(async () => {
      try {
        await createSettlement({ from_user: debtor.id, to_user: creditor.id, amount: Math.abs(net) });
        toast.success("Écart rééquilibré");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Dépenses partagées ce mois-ci : <span className="font-medium text-foreground">{formatAmount(totalShared)}</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        {contributions.map((c, i) => (
          <ContributionCard key={c.profile.id} contribution={c} index={i} />
        ))}
      </div>

      {!settled && debtor && creditor && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              Écart cumulé depuis le début : {debtor.display_name} a un peu moins contribué que{" "}
              {creditor.display_name} ({formatAmount(Math.abs(net))})
            </p>
            <Button variant="outline" size="sm" disabled={pending} onClick={handleRebalance}>
              {pending ? "..." : "Rééquilibrer"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
