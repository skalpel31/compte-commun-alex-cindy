"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleAlert, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditBillSheet } from "@/components/bill-sheet";
import { deleteBill, markBillPaid, markBillUnpaid } from "@/lib/actions";
import { CategoryIcon } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { BillWithStatus, Category, Profile } from "@/lib/types";

const STATUS_META = {
  paid: { label: "Payée", className: "text-good", Icon: Check },
  overdue: { label: "En retard", className: "text-critical", Icon: CircleAlert },
  upcoming: { label: "Bientôt due", className: "text-warning", Icon: Clock },
  later: { label: "", className: "text-muted-foreground", Icon: Clock },
} as const;

export function BillRow({
  bill,
  profiles,
  categories,
}: {
  bill: BillWithStatus;
  profiles: Profile[];
  categories: Category[];
}) {
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const meta = STATUS_META[bill.status];
  const StatusIcon = meta.Icon;
  const payerName = profiles.find((p) => p.id === bill.default_payer)?.display_name;

  function pay(userId: string) {
    setPickerOpen(false);
    startTransition(async () => {
      try {
        await markBillPaid(bill.id, userId);
        toast.success(`${bill.name} marquée payée`);
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleCheckClick() {
    if (bill.status === "paid") {
      startTransition(async () => {
        try {
          await markBillUnpaid(bill.id);
        } catch (err) {
          toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
        }
      });
    } else if (bill.default_payer) {
      pay(bill.default_payer);
    } else {
      setPickerOpen(true);
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
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
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
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
            {payerName && <span className="text-muted-foreground"> · {payerName}</span>}
            {bill.split_type === "personal" && (
              <span className="text-muted-foreground"> · personnel</span>
            )}
          </p>
        </div>
      </button>
      <p className="shrink-0 text-sm font-semibold">{formatAmount(bill.amount)}</p>
      <Button
        size="icon-sm"
        variant={bill.status === "paid" ? "secondary" : "outline"}
        disabled={pending}
        onClick={handleCheckClick}
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

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Qui a payé « {bill.name} » ?</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pay(p.id)}
                className="rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <EditBillSheet
        bill={bill}
        categories={categories}
        profiles={profiles}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
