"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { updateIncomeAmount } from "@/lib/actions";
import type { IncomeSource } from "@/lib/data";
import { monthLabel, shiftMonth } from "@/lib/format";

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
  const [budgetMonth, setBudgetMonth] = useState(source.budgetMonth);
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
          budget_month: budgetMonth,
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
        <div className="flex flex-col gap-5 px-4">
          <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
            <Label>Compte pour le mois de</Label>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setBudgetMonth(shiftMonth(budgetMonth, -1))}
                aria-label="Mois précédent"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-32 text-center text-sm font-medium capitalize">
                {monthLabel(budgetMonth)}
              </span>
              <button
                type="button"
                onClick={() => setBudgetMonth(shiftMonth(budgetMonth, 1))}
                aria-label="Mois suivant"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
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
