"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MemberClaimLink({ claimCode }: { claimCode: string }) {
  async function handleCopy() {
    const url = `${window.location.origin}/signup?claim=${claimCode}`;
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié");
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-2">
      <p className="text-xs text-muted-foreground">
        Pas encore de compte — envoie-lui son lien pour qu&apos;il/elle se connecte un jour si elle veut.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        Copier le lien
      </Button>
    </div>
  );
}
