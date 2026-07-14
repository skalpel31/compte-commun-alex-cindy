"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
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
import { createPocket, deletePocket, updatePocketAllocation } from "@/lib/actions";
import type { Pocket } from "@/lib/types";

const CHART_SLOTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"];

const ICON_LABELS: Record<string, string> = {
  "piggy-bank": "Tirelire",
  wallet: "Portefeuille",
  home: "Maison",
  car: "Voiture",
  "heart-pulse": "Santé",
  "party-popper": "Fête",
  "shopping-cart": "Panier",
  "more-horizontal": "Autre",
};

function PocketRow({ pocket }: { pocket: Pocket }) {
  const [value, setValue] = useState(pocket.allocation_pct);
  const [pending, startTransition] = useTransition();

  function handleChange(next: number) {
    setValue(next);
    startTransition(async () => {
      try {
        await updatePocketAllocation(pocket.id, next);
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePocket(pocket.id);
        toast.success("Poche supprimée");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(pocket.color)}`}>
        <CategoryIcon icon={pocket.icon} className="size-4" />
      </div>
      <span className="flex-1 text-sm">{pocket.name}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        disabled={pending}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-24 accent-primary"
      />
      <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{value}%</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Supprimer la poche"
        className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function NewPocketSheet({ nextColor }: { nextColor: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("piggy-bank");
  const [allocation, setAllocation] = useState(0);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Donne un nom à la poche");
      return;
    }
    startTransition(async () => {
      try {
        await createPocket({ name: name.trim(), icon, color: nextColor, allocation_pct: allocation });
        toast.success("Poche créée");
        setName("");
        setAllocation(0);
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
        Nouvelle poche
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvelle poche</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pocket-name">Nom</Label>
              <Input
                id="pocket-name"
                placeholder="Livret Mila, Livret Lino..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Icône</Label>
              <Select value={icon} onValueChange={(v) => setIcon(v ?? "piggy-bank")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: string) => ICON_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ICON_LABELS).map((i) => (
                    <SelectItem key={i} value={i}>
                      {ICON_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Part des revenus</Label>
                <span className="text-sm font-medium tabular-nums">{allocation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={allocation}
                onChange={(e) => setAllocation(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Optionnel — laisse à 0% si cette poche ne reçoit pas directement une part du
                salaire (tu pourras y virer de l&apos;argent manuellement).
              </p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              Créer la poche
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function PocketManager({ pockets }: { pockets: Pocket[] }) {
  const total = pockets.reduce((sum, p) => sum + p.allocation_pct, 0);
  const usedColors = new Set(pockets.map((p) => p.color));
  const nextColor = CHART_SLOTS.find((c) => !usedColors.has(c)) ?? CHART_SLOTS[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y">
        {pockets.map((p) => (
          <PocketRow key={p.id} pocket={p} />
        ))}
      </div>
      <p className={`text-xs ${total === 100 ? "text-muted-foreground" : "text-warning"}`}>
        Total : {total}% {total !== 100 && "— idéalement 100% pour répartir tout revenu"}
      </p>
      <NewPocketSheet nextColor={nextColor} />
    </div>
  );
}
