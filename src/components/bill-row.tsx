"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleAlert, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBill, markBillPaid, markBillUnpaid } from "@/lib/actions";
import { CategoryIcon } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { BillWithStatus, Profile } from "@/lib/types";

const STATUS_META = {
  paid: { label: "Payée", className: "text-good", Icon: Check },
  overdue: { label: "En retard", className: "text-critical", Icon: CircleAlert },
  upcoming: { label: "Bientôt due", className: "text-warning", Icon: Clock },
  later: { label: "", className: "text-muted-foreground", Icon: Clock },
} as const;

export function BillRow({ bill, currentUser }: { bill: BillWithStatus; currentUser: Profile | null }) {
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[bill.status];
  const StatusIcon = meta.Icon;

  function handleTogglePaid() {
    if (!currentUser) return;
    startTransition(async () => {
      try {
        if (bill.status === "paid") {
          await markBillUnpaid(bill.id);
        } else {
          await markBillPaid(bill.id, currentUser.id);
          toast.success(`${bill.name} marquée payée`);
        }
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteBill(bill.id);
        toast.success("Facture supprimée");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <CategoryIcon icon={bill.category?.icon ?? null} className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{bill.name}</p>
        <p className={`flex items-center gap-1 text-xs ${meta.className}`}>
          {bill.status !== "later" && <StatusIcon className="size-3" />}
          {bill.status === "later"
            ? `Le ${bill.due_day} du mois`
            : `${meta.label} · le ${bill.due_day}`}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold">{formatAmount(bill.amount)}</p>
      <Button
        size="icon-sm"
        variant={bill.status === "paid" ? "secondary" : "outline"}
        disabled={pending}
        onClick={handleTogglePaid}
        aria-label={bill.status === "paid" ? "Marquer non payée" : "Marquer payée"}
      >
        <Check className="size-4" />
      </Button>
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
