"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logWeight } from "@/lib/actions";
import { localDateString } from "@/lib/format";

export function WeightLogForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [date, setDate] = useState(localDateString(new Date()));
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const numeric = parseFloat(weight.replace(",", "."));
    if (!numeric || numeric <= 0) {
      toast.error("Indique un poids valide");
      return;
    }
    startTransition(async () => {
      try {
        await logWeight(profileId, date, numeric, note.trim() || undefined);
        toast.success("Pesée enregistrée");
        setWeight("");
        setNote("");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Peser aujourd&apos;hui</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weight-date">Date</Label>
          <Input id="weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weight-value">Poids (kg)</Label>
          <Input
            id="weight-value"
            inputMode="decimal"
            placeholder="0,0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight-note">Note (optionnel)</Label>
        <Input
          id="weight-note"
          placeholder="ex. après le sport"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button onClick={handleSubmit} disabled={pending} size="sm" className="self-end">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}
