"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteWeightLog } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import type { WeightLog } from "@/lib/types";

export function WeightHistoryList({ logs }: { logs: WeightLog[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteWeightLog(id);
        toast.success("Pesée supprimée");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  if (logs.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Aucune pesée enregistrée.</p>;
  }

  return (
    <div className="flex flex-col divide-y">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">{formatDate(log.date)}</span>
          <div className="flex items-center gap-3">
            <span className="font-medium tabular-nums">{log.weight_kg} kg</span>
            {log.note && <span className="text-xs text-muted-foreground">{log.note}</span>}
            <button
              type="button"
              onClick={() => handleDelete(log.id)}
              disabled={pending}
              aria-label="Supprimer la pesée"
              className="p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
