"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { updatePocketAllocation } from "@/lib/actions";
import type { Pocket } from "@/lib/types";

function PocketRow({ pocket }: { pocket: Pocket }) {
  const [value, setValue] = useState(pocket.allocation_pct);
  const [pending, startTransition] = useTransition();

  function handleChange(next: number) {
    setValue(next);
    startTransition(async () => {
      try {
        await updatePocketAllocation(pocket.id, next);
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(pocket.color)}`}>
        <CategoryIcon icon={pocket.icon} className="size-4" />
      </div>
      <span className="flex-1 text-sm">{pocket.name}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-24 accent-primary"
      />
      <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{value}%</span>
    </div>
  );
}

export function PocketManager({ pockets }: { pockets: Pocket[] }) {
  const total = pockets.reduce((sum, p) => sum + p.allocation_pct, 0);

  return (
    <div className="flex flex-col divide-y">
      {pockets.map((p) => (
        <PocketRow key={p.id} pocket={p} />
      ))}
      <p className={`pt-2 text-xs ${total === 100 ? "text-muted-foreground" : "text-warning"}`}>
        Total : {total}% {total !== 100 && "— idéalement 100% pour répartir tout revenu"}
      </p>
    </div>
  );
}
