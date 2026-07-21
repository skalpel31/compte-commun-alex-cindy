"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { addSalary } from "@/lib/actions";
import { localDateString } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function AddIncomeSheet({
  profiles,
  className,
}: {
  profiles: Profile[];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => localDateString(new Date()));
  const [note, setNote] = useState("");
  const [payerId, setPayerId] = useState<string | null>(profiles[0]?.id ?? null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!payerId) {
      toast.error("Choisis qui a touché ce salaire");
      return;
    }
    startTransition(async () => {
      try {
        await addSalary({ payerId, amount: numericAmount, date, note: note.trim() || undefined });
        toast.success("Salaire ajouté");
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
    <div className={className}>
      <Button size="xs" variant="secondary" className="w-fit" onClick={() => setOpen(true)}>
        <Plus className="size-3" />
        Salaire
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-sm rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Ajouter un salaire</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4">
            <div className="flex flex-col gap-2">
              <Label>De qui ?</Label>
              <div className="grid grid-cols-2 gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayerId(p.id)}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      payerId === p.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {p.display_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Label htmlFor="salary-amount" className="text-xs text-muted-foreground">
                Combien ?
              </Label>
              <div className="flex items-baseline gap-1">
                <Input
                  id="salary-amount"
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
              <Label htmlFor="salary-date">Quand ?</Label>
              <Input
                id="salary-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="salary-note">Note (optionnel)</Label>
              <Input
                id="salary-note"
                placeholder="ex : Pro BTP, Sécu..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Utile si ton salaire arrive en plusieurs fois de sources différentes — ajoute
                chaque versement séparément avec sa propre note.
              </p>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Enregistrement..." : "Ajouter le salaire"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
