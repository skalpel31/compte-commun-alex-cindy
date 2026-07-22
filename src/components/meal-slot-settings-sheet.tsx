"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { upsertMealSlot } from "@/lib/actions";
import { MEAL_TYPES, MEAL_TYPE_LABELS, dayOfWeekLabel } from "@/lib/nutrition";
import type { MealSlot, MealType, Profile } from "@/lib/types";

export function MealSlotSettingsSheet({ slots, profiles }: { slots: MealSlot[]; profiles: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(dayOfWeek: number, mealType: MealType, current: string[], profileId: string) {
    const next = current.includes(profileId)
      ? current.filter((id) => id !== profileId)
      : [...current, profileId];
    startTransition(async () => {
      try {
        await upsertMealSlot(dayOfWeek, mealType, next);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="size-4" />
        Configurer les repas
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Qui mange quoi, chaque semaine</SheetTitle>
          </SheetHeader>
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Ce modèle se répète chaque semaine — modifiable à tout moment (ex. le mercredi midi les
              enfants sont là aussi).
            </p>
            {Array.from({ length: 7 }, (_, day) => day).map((day) => (
              <div key={day} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{dayOfWeekLabel(day)}</p>
                {MEAL_TYPES.map((mealType) => {
                  const slot = slots.find((s) => s.day_of_week === day && s.meal_type === mealType);
                  const current = slot?.participant_profile_ids ?? [];
                  return (
                    <div key={mealType} className="flex items-center gap-2 pl-2">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">
                        {MEAL_TYPE_LABELS[mealType]}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            disabled={pending}
                            onClick={() => toggle(day, mealType, current, p.id)}
                            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                              current.includes(p.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {p.display_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
