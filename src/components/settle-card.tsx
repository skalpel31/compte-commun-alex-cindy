"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { createSettlement } from "@/lib/actions";
import { formatAmount } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function SettleCard({ net, profiles }: { net: number; profiles: Profile[] }) {
  const [pending, startTransition] = useTransition();
  const [a, b] = profiles;
  const settled = Math.abs(net) < 0.005;

  const debtorIndex = net > 0 ? 1 : 0;
  const creditorIndex = net > 0 ? 0 : 1;
  const debtor = net > 0 ? b : a;
  const creditor = net > 0 ? a : b;

  function handleSettle() {
    if (!debtor || !creditor) return;
    startTransition(async () => {
      try {
        await createSettlement({
          from_user: debtor.id,
          to_user: creditor.id,
          amount: Math.abs(net),
        });
        toast.success("Compte soldé");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  if (settled || !debtor || !creditor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <PartyPopper className="size-8 text-good" />
          <p className="text-lg font-semibold">Vous êtes à jour</p>
          <p className="text-sm text-muted-foreground">Aucune somme en attente entre vous deux.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <ProfileAvatar profile={debtor} index={debtorIndex} size="lg" />
            <span className="text-xs font-medium">{debtor.display_name}</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="flex flex-col items-center gap-1.5">
            <ProfileAvatar profile={creditor} index={creditorIndex} size="lg" />
            <span className="text-xs font-medium">{creditor.display_name}</span>
          </div>
        </div>
        <p className="text-4xl font-semibold tabular-nums">{formatAmount(Math.abs(net))}</p>
        <Button disabled={pending} onClick={handleSettle}>
          {pending ? "..." : "Marquer comme réglé"}
        </Button>
      </CardContent>
    </Card>
  );
}
