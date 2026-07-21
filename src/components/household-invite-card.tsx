"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function HouseholdInviteCard({ inviteCode }: { inviteCode: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    toast.success("Code copié");
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-mono text-lg tracking-widest">{inviteCode}</p>
        <p className="text-xs text-muted-foreground">
          À partager avec votre partenaire pour qu&apos;il/elle rejoigne ce foyer à l&apos;inscription.
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        Copier
      </Button>
    </div>
  );
}
