"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { createBudgetCategory } from "@/lib/actions";
import { CategoryIcon, CATEGORY_ICON_LABELS, CATEGORY_ICON_OPTIONS } from "@/lib/category-style";

export function NewBudgetSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Donne un nom à ce budget");
      return;
    }
    const trimmed = amount.trim();
    let numeric: number | null = null;
    if (trimmed) {
      const parsed = parseFloat(trimmed.replace(",", "."));
      if (Number.isNaN(parsed) || parsed < 0) {
        toast.error("Montant invalide");
        return;
      }
      // 0 means "no fixed amount yet" — same as leaving the field blank, it
      // just goes straight to auto instead of blocking the creation.
      numeric = parsed > 0 ? parsed : null;
    }
    startTransition(async () => {
      try {
        await createBudgetCategory(name.trim(), icon, numeric);
        toast.success(numeric ? "Budget créé" : "Budget créé, en auto");
        setName("");
        setAmount("");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouveau budget
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouveau budget</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-budget-name">Nom</Label>
              <Input
                id="new-budget-name"
                placeholder="ex : Cadeaux, Vacances..."
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Icône</Label>
              <Select value={icon} onValueChange={(v) => setIcon(v ?? CATEGORY_ICON_OPTIONS[0])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) => (
                      <span className="flex items-center gap-2">
                        <CategoryIcon icon={value} className="size-4" />
                        {CATEGORY_ICON_LABELS[value]}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ICON_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>
                      <span className="flex items-center gap-2">
                        <CategoryIcon icon={i} className="size-4" />
                        {CATEGORY_ICON_LABELS[i]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-budget-amount">Budget mensuel (optionnel)</Label>
              <Input
                id="new-budget-amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Laisse vide pour le laisser en auto — il se remplira tout seul dès qu&apos;une
                facture sera rattachée à cette catégorie.
              </p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              {pending ? "Création..." : "Créer le budget"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
