"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { createBill } from "@/lib/actions";
import type { Category } from "@/lib/types";

export function NewBillSheet({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [autopay, setAutopay] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    const numericAmount = parseFloat(amount.replace(",", "."));
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !numericAmount || numericAmount <= 0 || !day || day < 1 || day > 28) {
      toast.error("Vérifie le nom, le montant et le jour (1-28)");
      return;
    }
    startTransition(async () => {
      try {
        await createBill({
          name: name.trim(),
          amount: numericAmount,
          due_day: day,
          category_id: categoryId === "none" ? null : categoryId,
          autopay,
        });
        toast.success("Facture ajoutée");
        setName("");
        setAmount("");
        setDueDay("1");
        setAutopay(false);
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
        Nouvelle facture
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvelle facture récurrente</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-name">Nom</Label>
              <Input
                id="bill-name"
                placeholder="Loyer, électricité, internet..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-amount">Montant</Label>
                <Input
                  id="bill-amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-day">Jour d&apos;échéance</Label>
                <Input
                  id="bill-day"
                  type="number"
                  min={1}
                  max={28}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Optionnel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Prélèvement automatique</p>
                <p className="text-xs text-muted-foreground">Pas besoin de la marquer payée</p>
              </div>
              <Switch checked={autopay} onCheckedChange={setAutopay} />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              Créer la facture
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
