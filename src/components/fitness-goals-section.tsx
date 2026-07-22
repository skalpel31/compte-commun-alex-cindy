"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Target, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createFitnessGoal, deleteFitnessGoal } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import type { FitnessGoal, FitnessGoalTerm } from "@/lib/types";

const TERM_LABELS: Record<FitnessGoalTerm, string> = {
  moyen_terme: "Moyen terme",
  long_terme: "Long terme",
};

function GoalCard({ goal }: { goal: FitnessGoal }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteFitnessGoal(goal.id);
        toast.success("Objectif supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Target className="size-4 text-chart-5" />
          {goal.name}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Supprimer l'objectif"
          className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
      <p className="text-xs text-muted-foreground">
        {TERM_LABELS[goal.term]}
        {goal.target_date && ` · échéance ${formatDate(goal.target_date)}`}
      </p>
    </div>
  );
}

function NewGoalSheet({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState<FitnessGoalTerm>("moyen_terme");
  const [targetDate, setTargetDate] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Donne un nom à cet objectif");
      return;
    }
    startTransition(async () => {
      try {
        await createFitnessGoal(profileId, {
          name: name.trim(),
          description: description.trim() || null,
          term,
          target_date: targetDate || null,
        });
        toast.success("Objectif créé");
        setName("");
        setDescription("");
        setTargetDate("");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouvel objectif
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvel objectif</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-name">Nom</Label>
              <Input
                id="goal-name"
                placeholder="ex. faire une traction, tenir la planche 1 min..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-description">Description (optionnel)</Label>
              <Input
                id="goal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Terme</Label>
              <Select value={term} onValueChange={(v) => setTerm((v ?? "moyen_terme") as FitnessGoalTerm)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Moyen terme">
                    {(value: string) => TERM_LABELS[value as FitnessGoalTerm]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moyen_terme">Moyen terme</SelectItem>
                  <SelectItem value="long_terme">Long terme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-date">Date cible (optionnel)</Label>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              Créer l&apos;objectif
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function FitnessGoalsSection({ profileId, goals }: { profileId: string; goals: FitnessGoal[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Objectifs</CardTitle>
        <NewGoalSheet profileId={profileId} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucun objectif pour l&apos;instant — une traction, tenir la planche, un muscle-up...
          </p>
        ) : (
          goals.map((g) => <GoalCard key={g.id} goal={g} />)
        )}
      </CardContent>
    </Card>
  );
}
