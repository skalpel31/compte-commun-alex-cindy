"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { deleteCategory, upsertCategory } from "@/lib/actions";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import type { Category } from "@/lib/types";

const CHART_SLOTS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
];

const ICON_LABELS: Record<string, string> = {
  "shopping-cart": "Panier",
  home: "Maison",
  car: "Voiture",
  repeat: "Abonnement",
  "party-popper": "Fête",
  "heart-pulse": "Santé",
  "more-horizontal": "Autre",
  wallet: "Portefeuille",
};

const ICON_OPTIONS = Object.keys(ICON_LABELS);
const TYPE_LABELS = { expense: "Dépense", income: "Revenu" } as const;

function NewCategorySheet({ nextColor }: { nextColor: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Donne un nom à la catégorie");
      return;
    }
    startTransition(async () => {
      try {
        await upsertCategory({ name: name.trim(), icon, color: nextColor, type });
        toast.success("Catégorie créée");
        setName("");
        setOpen(false);
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouvelle catégorie
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvelle catégorie</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-name">Nom</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Icône</Label>
                <Select value={icon} onValueChange={(v) => setIcon(v ?? ICON_OPTIONS[0])}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(value: string) => ICON_LABELS[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {ICON_LABELS[i]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType((v ?? "expense") as "expense" | "income")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: keyof typeof TYPE_LABELS) => TYPE_LABELS[value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Dépense</SelectItem>
                    <SelectItem value="income">Revenu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              Créer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success("Catégorie supprimée");
      } catch (err) {
        toast.error("Échec — des transactions y sont peut-être liées", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  const usedColors = new Set(categories.map((c) => c.color));
  const nextColor = CHART_SLOTS.find((c) => !usedColors.has(c)) ?? CHART_SLOTS[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y">
        {categories.map((c) => {
          return (
            <div key={c.id} className="flex items-center gap-3 py-2">
              <div className={`flex size-8 items-center justify-center rounded-full text-white ${categoryBg(c.color)}`}>
                <CategoryIcon icon={c.icon} className="size-4" />
              </div>
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.type === "income" ? "Revenu" : "Dépense"}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                disabled={pending}
                aria-label="Supprimer"
                className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
      <NewCategorySheet nextColor={nextColor} />
    </div>
  );
}
