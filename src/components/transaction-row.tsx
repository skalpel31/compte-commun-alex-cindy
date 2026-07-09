"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { Profile, Transaction } from "@/lib/types";

export function TransactionRow({
  transaction,
  profiles,
}: {
  transaction: Transaction;
  profiles: Profile[];
}) {
  const [pending, startTransition] = useTransition();
  const payer = profiles.find((p) => p.id === transaction.paid_by);
  const isIncome = transaction.category?.type === "income";

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTransaction(transaction.id);
        toast.success("Transaction supprimée");
      } catch (err) {
        toast.error("Suppression impossible", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(
          transaction.category?.color ?? null
        )}`}
      >
        <CategoryIcon icon={transaction.category?.icon ?? null} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description || transaction.category?.name || "Sans description"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.category?.name} · {payer?.display_name}
          {transaction.split_type === "personal" && " · personnel"}
        </p>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${isIncome ? "text-good" : ""}`}>
        {isIncome ? "+" : "-"}
        {formatAmount(transaction.amount)}
      </p>
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
  );
}
