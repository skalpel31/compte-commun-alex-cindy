"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteBudget, upsertBudget } from "@/lib/actions";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/lib/types";

export function BudgetRow({
  category,
  budgetId,
  limit,
  spent,
}: {
  category: Category;
  budgetId: string | null;
  limit: number | null;
  spent: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(limit ? String(limit) : "");
  const [pending, startTransition] = useTransition();

  const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const severity = !limit ? "" : pct >= 100 ? "bg-critical" : pct >= 80 ? "bg-warning" : categoryBg(category.color);

  function handleSave() {
    const numeric = parseFloat(amount.replace(",", "."));
    if (!numeric || numeric <= 0) {
      toast.error("Montant invalide");
      return;
    }
    startTransition(async () => {
      try {
        await upsertBudget({
          category_id: category.id,
          amount_limit: numeric,
          scope: "shared",
          user_id: null,
        });
        toast.success("Budget enregistré");
        setOpen(false);
      } catch (err) {
        toast.error("Échec de l'enregistrement", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    if (!budgetId) return;
    startTransition(async () => {
      try {
        await deleteBudget(budgetId);
        toast.success("Budget supprimé");
        setOpen(false);
      } catch (err) {
        toast.error("Échec de la suppression", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-2 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <CategoryIcon icon={category.icon} className={`size-4 shrink-0 ${categoryText(category.color)}`} />
          <span className="flex-1 text-sm font-medium">{category.name}</span>
          {limit ? (
            <span className="text-xs text-muted-foreground">
              {formatAmount(spent)} / {formatAmount(limit)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Définir un budget</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          {limit && (
            <div
              className={`h-full rounded-full transition-all ${severity}`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          )}
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CategoryIcon icon={category.icon} className={`size-4 ${categoryText(category.color)}`} />
              {category.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            <Label htmlFor="budget-amount">Budget mensuel</Label>
            <Input
              id="budget-amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Déjà dépensé ce mois-ci : {formatAmount(spent)}
            </p>
          </div>
          <SheetFooter className="flex-row gap-2">
            {budgetId && (
              <Button variant="outline" className="flex-1" onClick={handleDelete} disabled={pending}>
                Supprimer
              </Button>
            )}
            <Button className="flex-1" onClick={handleSave} disabled={pending}>
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
