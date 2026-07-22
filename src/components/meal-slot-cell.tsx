"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { assignRecipeToSlot } from "@/lib/actions";
import { computePersonalPortion } from "@/lib/nutrition";
import type { MealType, Profile, Recipe } from "@/lib/types";

export function MealSlotCell({
  weekStart,
  dayOfWeek,
  mealType,
  recipe,
  participants,
  calorieTargetByProfileId,
}: {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
  recipe: Recipe | null;
  participants: Profile[];
  calorieTargetByProfileId: Map<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      try {
        await assignRecipeToSlot(
          weekStart,
          dayOfWeek,
          mealType,
          null,
          participants.map((p) => p.id)
        );
        toast.success("Recette retirée");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-16 w-full flex-col items-start gap-0.5 rounded-lg border border-border p-2 text-left transition-colors hover:bg-muted"
      >
        {recipe ? (
          <span className="text-xs font-medium">{recipe.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">À définir</span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {participants.map((p) => p.display_name).join(", ")}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{recipe?.name ?? "Aucune recette assignée"}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            {recipe ? (
              <>
                {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}
                {participants.map((person) => {
                  const target = calorieTargetByProfileId.get(person.id) ?? null;
                  const portion = computePersonalPortion(recipe, mealType, target);
                  return (
                    <div key={person.id} className="rounded-lg border p-2.5">
                      <p className="mb-1 text-sm font-medium">{person.display_name}</p>
                      <ul className="flex flex-col gap-0.5">
                        {portion.map((ing) => (
                          <li key={ing.name} className="flex justify-between text-xs text-muted-foreground">
                            <span>{ing.name}</span>
                            <span className="tabular-nums">{ing.quantity_g} g</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {recipe.instructions && (
                  <div className="rounded-lg border p-2.5">
                    <p className="mb-1 text-sm font-medium">Préparation</p>
                    <p className="whitespace-pre-line text-xs text-muted-foreground">{recipe.instructions}</p>
                  </div>
                )}
                <Button variant="outline" onClick={handleClear} disabled={pending} className="self-start">
                  <Trash2 className="size-4" />
                  Retirer cette recette
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Génère le menu de la semaine pour remplir ce créneau.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
