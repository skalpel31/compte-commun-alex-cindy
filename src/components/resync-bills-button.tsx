"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resyncBillPayments } from "@/lib/actions";

export function ResyncBillsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const count = await resyncBillPayments();
        toast.success(
          count ? `${count} paiement${count > 1 ? "s" : ""} resynchronisé${count > 1 ? "s" : ""}` : "Rien à resynchroniser"
        );
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={pending}>
      <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      Resynchroniser les comptes
    </Button>
  );
}
