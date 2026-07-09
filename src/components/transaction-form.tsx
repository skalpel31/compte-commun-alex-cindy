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
import type { Category, Profile } from "@/lib/types";

export function TransactionForm({
  categories,
  profiles,
}: {
  categories: Category[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => localDateString(new Date()));
  const [categoryId, setCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState(profiles[0]?.id ?? "");
  const [splitType, setSplitType] = useState<"shared" | "personal">("shared");
  const [payerShare, setPayerShare] = useState(50);

  const other = profiles.find((p) => p.id !== paidBy);
  const payer = profiles.find((p) => p.id === paidBy);

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

    const split_ratio =
      splitType === "shared" && other
        ? { [paidBy]: payerShare, [other.id]: 100 - payerShare }
        : { [paidBy]: 100 };

    startTransition(async () => {
      try {
        await createTransaction({
          amount: numericAmount,
          description,
          date,
          category_id: categoryId,
          paid_by: paidBy,
          split_type: splitType,
          split_ratio,
        });
        toast.success("Transaction ajoutée");
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
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Courses de la semaine..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Catégorie</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir" />
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

      <div className="flex flex-col gap-2">
        <Label>Payé par</Label>
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Répartition</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSplitType("shared")}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
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
              "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              splitType === "personal"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            Personnel
          </button>
        </div>
      </div>

      {splitType === "shared" && other && payer && (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span>{payer.display_name}</span>
            <span className="font-medium">{payerShare}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={payerShare}
            onChange={(e) => setPayerShare(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{other.display_name}</span>
            <span className="font-medium">{100 - payerShare}%</span>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Enregistrement..." : "Ajouter la transaction"}
      </Button>
    </form>
  );
}
