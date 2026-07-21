"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { createTransaction } from "@/lib/actions";
import { localDateString } from "@/lib/format";
import type { Category, Pocket, Profile } from "@/lib/types";

export function TransactionForm({
  categories,
  profiles,
  pockets,
  initialCategoryId,
}: {
  categories: Category[];
  profiles: Profile[];
  pockets: Pocket[];
  initialCategoryId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => localDateString(new Date()));
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");
  const [pocketId, setPocketId] = useState(
    () => categories.find((c) => c.id === initialCategoryId)?.default_pocket_id ?? ""
  );
  const [pocketTouched, setPocketTouched] = useState(false);
  const [paidBy, setPaidBy] = useState<string | null>(profiles[0]?.id ?? null);

  const category = categories.find((c) => c.id === categoryId);
  const isIncome = category?.type === "income";
  const isOther = category?.name === "Autre";

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    if (!pocketTouched) {
      const cat = categories.find((c) => c.id === value);
      setPocketId(cat?.default_pocket_id ?? "");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!categoryId) {
      toast.error("Choisis une catégorie");
      return;
    }
    if (isOther && !description.trim()) {
      toast.error("Précise ce que c'est pour la catégorie Autre");
      return;
    }

    startTransition(async () => {
      try {
        await createTransaction({
          amount: numericAmount,
          description,
          date,
          category_id: categoryId,
          paid_by: paidBy,
          pocket_id: isIncome ? null : pocketId || null,
        });
        toast.success(isIncome ? "Revenu réparti dans les comptes" : "Transaction ajoutée");
        router.replace("/transactions");
        router.refresh();
      } catch (err) {
        toast.error("Impossible d'enregistrer", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour
      </button>

      <div className="flex flex-col items-center gap-1 py-4">
        <Label htmlFor="amount" className="text-xs text-muted-foreground">
          Montant
        </Label>
        <div className="flex items-baseline gap-1">
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0,00"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-auto w-48 border-none bg-transparent px-0 text-center text-5xl font-semibold shadow-none focus-visible:ring-0"
          />
          <span className="text-2xl font-semibold text-muted-foreground">€</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">
          Description{isOther && <span className="text-critical"> · précise ce que c&apos;est</span>}
        </Label>
        <Input
          id="description"
          placeholder={isOther ? "Ex. réparation vélo, cadeau..." : "Courses de la semaine..."}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Catégorie</Label>
          <Select value={categoryId} onValueChange={(v) => handleCategoryChange(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir">
                {(value: string) => categories.find((c) => c.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isIncome ? (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Un revenu se répartit automatiquement dans tous les comptes, selon leurs pourcentages
          (réglables dans Réglages).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>Compte</Label>
          <Select value={pocketId} onValueChange={(v) => { setPocketId(v ?? ""); setPocketTouched(true); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un compte">
                {(value: string) => pockets.find((p) => p.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pockets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Payé par</Label>
        <div className="grid grid-cols-3 gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaidBy(p.id)}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                paidBy === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              {p.display_name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaidBy(null)}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              paidBy === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            Compte Joint
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Enregistrement..." : "Ajouter la transaction"}
      </Button>
    </form>
  );
}
