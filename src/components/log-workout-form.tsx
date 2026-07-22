"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logWorkout } from "@/lib/actions";
import { localDateString } from "@/lib/format";

export function LogWorkoutForm({ profileId, programId }: { profileId: string; programId: string | null }) {
  const router = useRouter();
  const [date, setDate] = useState(localDateString(new Date()));
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await logWorkout(profileId, programId, date, notes.trim() || undefined);
        toast.success("Séance enregistrée");
        setNotes("");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Marquer une séance faite</p>
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        <Input
          placeholder="Note (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={handleSubmit} disabled={pending}>
          {pending ? "..." : "Valider"}
        </Button>
      </div>
    </div>
  );
}
