import { Check } from "lucide-react";
import type { Category, Pocket } from "@/lib/types";

export function AllocationRules({
  categories,
  pockets,
}: {
  categories: Category[];
  pockets: Pocket[];
}) {
  const rules = categories.filter((c) => c.type === "expense");

  if (rules.length === 0) {
    return (
      <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Ajoute des catégories pour définir des règles.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {rules.map((c) => {
        const pocket = pockets.find((p) => p.id === c.default_pocket_id);
        return (
          <div key={c.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {pocket ? `Toujours avec ${pocket.name}` : "Non définie"}
            </span>
            {pocket && <Check className="size-4 shrink-0 text-good" />}
          </div>
        );
      })}
    </div>
  );
}
