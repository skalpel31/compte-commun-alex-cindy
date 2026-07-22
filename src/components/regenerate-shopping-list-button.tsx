"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateShoppingList } from "@/lib/actions";

export function RegenerateShoppingListButton({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await generateShoppingList(weekStart);
        toast.success("Liste régénérée depuis le menu");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      <RefreshCw className="size-4" />
      Régénérer depuis le menu
    </Button>
  );
}
