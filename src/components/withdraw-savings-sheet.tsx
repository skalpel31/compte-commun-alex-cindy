"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { withdrawFromSavings } from "@/lib/actions";
import { localDateString } from "@/lib/format";

export function WithdrawSavingsSheet({ pocketId }: { pocketId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => localDateString(new Date()));
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    startTransition(async () => {
      try {
        await withdrawFromSavings({ pocketId, amount: numericAmount, date, note: note.trim() || undefined });
        toast.success("Retrait enregistré");
        setAmount("");
        setDate(localDateString(new Date()));
        setNote("");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Impossible d'enregistrer", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Minus className="size-4" />
        Retirer
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-sm rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Retirer de l&apos;épargne</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4">
            <div className="flex flex-col items-center gap-1">
              <Label htmlFor="withdraw-amount" className="text-xs text-muted-foreground">
                Combien ?
              </Label>
              <div className="flex items-baseline gap-1">
                <Input
                  id="withdraw-amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-auto w-40 border-none bg-transparent px-0 text-center text-4xl font-semibold shadow-none focus-visible:ring-0"
                />
                <span className="text-xl font-semibold text-muted-foreground">€</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="withdraw-date">Quand ?</Label>
              <Input
                id="withdraw-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="withdraw-note">Note (optionnel)</Label>
              <Input
                id="withdraw-note"
                placeholder="ex : réparation voiture..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Enregistrement..." : "Retirer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
