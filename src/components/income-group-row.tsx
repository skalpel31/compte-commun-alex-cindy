"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteTransactions } from "@/lib/actions";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import { payerLabel } from "@/lib/payer";
import type { Profile, Transaction } from "@/lib/types";

export function IncomeGroupRow({
  transactions,
  profiles,
}: {
  transactions: Transaction[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const first = transactions[0];
  const payerName = payerLabel(first.paid_by, profiles);
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTransactions(transactions.map((t) => t.id));
        toast.success("Revenu supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Suppression impossible", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <div className="flex flex-col py-3">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(
              first.category?.color ?? null
            )}`}
          >
            <CategoryIcon icon={first.category?.icon ?? null} className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {first.description || first.category?.name || "Revenu"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {first.category?.name} · {payerName} · réparti dans {transactions.length}{" "}
              comptes
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-good">+{formatAmount(total)}</p>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Supprimer"
          className="shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && (
        <div className="ml-12 mt-2 flex flex-col gap-1.5 border-l pl-3">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t.pocket?.name ?? "Compte inconnu"}</span>
              <span className="font-medium tabular-nums">{formatAmount(t.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
