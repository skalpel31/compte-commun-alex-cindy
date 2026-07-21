"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { updateIncomeAmount } from "@/lib/actions";
import type { IncomeSource } from "@/lib/data";

export function EditIncomeSheet({
  source,
  open,
  onOpenChange,
}: {
  source: IncomeSource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(source.amount));
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Montant invalide");
      return;
    }
    startTransition(async () => {
      try {
        await updateIncomeAmount({
          transactionIds: source.transactionIds,
          amount: value,
          description: source.label,
          date: source.date,
          category_id: source.categoryId ?? "",
          paid_by: source.paidBy,
        });
        toast.success("Revenu mis à jour");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{source.label}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          <Label htmlFor="edit-income-amount">Montant</Label>
          <Input
            id="edit-income-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={pending}>
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
