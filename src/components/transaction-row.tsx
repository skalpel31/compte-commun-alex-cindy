"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import { payerLabel } from "@/lib/payer";
import { ReceiptUpload } from "@/components/receipt-upload";
import type { Profile, Transaction } from "@/lib/types";

export function TransactionRow({
  transaction,
  profiles,
  householdId,
}: {
  transaction: Transaction;
  profiles: Profile[];
  householdId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const payerName = payerLabel(transaction.paid_by, profiles);
  const isIncome = transaction.category?.type === "income";

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTransaction(transaction.id);
        toast.success("Transaction supprimée");
        router.refresh();
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
          {transaction.category?.name} · {payerName}
          {transaction.split_type === "personal" && " · personnel"}
        </p>
        <ReceiptUpload
          table="transactions"
          id={transaction.id}
          householdId={householdId}
          receiptUrl={transaction.receipt_url}
        />
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
