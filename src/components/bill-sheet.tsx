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
import { createBill, updateBill, type BillInput } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Bill, Category, Profile } from "@/lib/types";

function BillForm({
  bill,
  categories,
  profiles,
  onDone,
}: {
  bill?: Bill;
  categories: Category[];
  profiles: Profile[];
  onDone: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? "");
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [dueDay, setDueDay] = useState(bill ? String(bill.due_day) : "1");
  const [categoryId, setCategoryId] = useState<string>(bill?.category_id ?? "none");
  const [payer, setPayer] = useState<string>(bill?.default_payer ?? "");
  const [splitType, setSplitType] = useState<"shared" | "personal">(bill?.split_type ?? "shared");
  const [autopay, setAutopay] = useState(bill?.autopay ?? false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const numericAmount = parseFloat(amount.replace(",", "."));
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !numericAmount || numericAmount <= 0 || !day || day < 1 || day > 28) {
      toast.error("Vérifie le nom, le montant et le jour (1-28)");
      return;
    }
    const input: BillInput = {
      name: name.trim(),
      amount: numericAmount,
      due_day: day,
      category_id: categoryId === "none" ? null : categoryId,
      default_payer: payer || null,
      split_type: splitType,
      autopay,
    };
    startTransition(async () => {
      try {
        if (bill) {
          await updateBill(bill.id, input);
          toast.success("Facture mise à jour");
        } else {
          await createBill(input);
          toast.success("Facture ajoutée");
        }
        onDone();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
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
              <SelectValue placeholder="Optionnel">
                {(value: string) =>
                  value === "none" ? "Aucune" : categories.find((c) => c.id === value)?.name
                }
              </SelectValue>
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
        <div className="flex flex-col gap-2">
          <Label>Payeur habituel</Label>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPayer(payer === p.id ? "" : p.id)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                  payer === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                {p.display_name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Optionnel — sinon on te demandera qui a payé à chaque fois.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Répartition</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSplitType("shared")}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                splitType === "shared"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              Partagé
            </button>
            <button
              type="button"
              onClick={() => setSplitType("personal")}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                splitType === "personal"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              Personnel
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Personnel = ne compte pas dans l&apos;objectif de contribution de l&apos;autre (ex :
            prêt ou assurance à ton nom).
          </p>
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
        <Button onClick={handleSave} disabled={pending}>
          {bill ? "Enregistrer" : "Créer la facture"}
        </Button>
      </SheetFooter>
    </>
  );
}

export function NewBillSheet({
  categories,
  profiles,
}: {
  categories: Category[];
  profiles: Profile[];
}) {
  const [open, setOpen] = useState(false);

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
          <BillForm categories={categories} profiles={profiles} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function EditBillSheet({
  bill,
  categories,
  profiles,
  open,
  onOpenChange,
}: {
  bill: Bill;
  categories: Category[];
  profiles: Profile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Modifier « {bill.name} »</SheetTitle>
        </SheetHeader>
        <BillForm
          bill={bill}
          categories={categories}
          profiles={profiles}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
