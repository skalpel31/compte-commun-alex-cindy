"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteShoppingListItem, toggleShoppingListItem } from "@/lib/actions";
import type { ShoppingListItem } from "@/lib/types";

export function ShoppingListItemRow({ item }: { item: ShoppingListItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleShoppingListItem(item.id, !item.checked);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteShoppingListItem(item.id);
        toast.success("Article supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <Button
        size="icon-sm"
        variant={item.checked ? "secondary" : "outline"}
        disabled={pending}
        onClick={handleToggle}
        aria-label={item.checked ? "Marquer non pris" : "Marquer pris"}
      >
        <Check className="size-4" />
      </Button>
      <span
        className={`flex-1 text-sm ${item.checked ? "text-muted-foreground line-through" : ""}`}
      >
        {item.name}
      </span>
      {item.quantity != null && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {item.quantity} {item.unit}
        </span>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Supprimer"
        className="p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
