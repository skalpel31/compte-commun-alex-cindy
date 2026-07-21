"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePocket } from "@/lib/actions";

export function DeletePocketButton({ pocketId }: { pocketId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deletePocket(pocketId);
        toast.success("Compte supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec — des transactions y sont peut-être liées", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Supprimer le compte"
      className="shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
