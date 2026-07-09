"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Target, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { contributeToGoal, createGoal, deleteGoal } from "@/lib/actions";
import { formatAmount } from "@/lib/format";
import type { Goal } from "@/lib/types";

function GoalCard({ goal }: { goal: Goal }) {
  const [contribution, setContribution] = useState("");
  const [pending, startTransition] = useTransition();
  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));

  function handleContribute() {
    const amount = parseFloat(contribution.replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    startTransition(async () => {
      try {
        await contributeToGoal(goal.id, amount);
        setContribution("");
        toast.success("Épargne ajoutée");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteGoal(goal.id);
        toast.success("Objectif supprimé");
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
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
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-chart-5 transition-all"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatAmount(goal.current_amount)} sur {formatAmount(goal.target_amount)} ({pct}%)
      </p>
      <div className="flex gap-2">
        <Input
          inputMode="decimal"
          placeholder="Ajouter un montant"
          value={contribution}
          onChange={(e) => setContribution(e.target.value)}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={handleContribute} disabled={pending}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function NewGoalSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    const targetAmount = parseFloat(target.replace(",", "."));
    if (!name.trim() || !targetAmount || targetAmount <= 0) {
      toast.error("Renseigne un nom et un montant cible");
      return;
    }
    startTransition(async () => {
      try {
        await createGoal({ name: name.trim(), target_amount: targetAmount, target_date: date || null });
        toast.success("Objectif créé");
        setName("");
        setTarget("");
        setDate("");
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
        Nouvel objectif
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvel objectif d&apos;épargne</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-name">Nom</Label>
              <Input
                id="goal-name"
                placeholder="Vacances, apport, fonds d'urgence..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-target">Montant cible</Label>
              <Input
                id="goal-target"
                inputMode="decimal"
                placeholder="0,00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-date">Date cible (optionnel)</Label>
              <Input id="goal-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

export function GoalsSection({ goals }: { goals: Goal[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Objectifs d&apos;épargne</CardTitle>
        <NewGoalSheet />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucun objectif pour l&apos;instant — vacances, apport, fonds d&apos;urgence...
          </p>
        ) : (
          goals.map((g) => <GoalCard key={g.id} goal={g} />)
        )}
      </CardContent>
    </Card>
  );
}
