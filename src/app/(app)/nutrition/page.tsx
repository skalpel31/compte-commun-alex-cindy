import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekNav } from "@/components/week-nav";
import { GenerateMenuSheet } from "@/components/generate-menu-sheet";
import { MealSlotSettingsSheet } from "@/components/meal-slot-settings-sheet";
import { MealSlotCell } from "@/components/meal-slot-cell";
import { getAllHealthProfiles, getMealPlanEntries, getMealSlots, getProfiles } from "@/lib/data";
import { MEAL_TYPES, MEAL_TYPE_LABELS, dayOfWeekLabel, getWeekStart } from "@/lib/nutrition";

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekStart = weekParam ?? getWeekStart();

  const [slots, entries, profiles, healthProfiles] = await Promise.all([
    getMealSlots(),
    getMealPlanEntries(weekStart),
    getProfiles(),
    getAllHealthProfiles(),
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const calorieTargetByProfileId = new Map(
    healthProfiles.filter((h) => h.daily_calorie_target).map((h) => [h.profile_id, h.daily_calorie_target as number])
  );
  const entryByKey = new Map(entries.map((e) => [`${e.day_of_week}:${e.meal_type}`, e]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nutrition</h1>
          <p className="text-sm text-muted-foreground">Le menu de la semaine, généré selon vos objectifs.</p>
        </div>
        <div className="flex items-center gap-2">
          <MealSlotSettingsSheet slots={slots} profiles={profiles} />
          <GenerateMenuSheet weekStart={weekStart} />
        </div>
      </div>

      <WeekNav weekStart={weekStart} basePath="/nutrition" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planning</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 7 }, (_, day) => day).map((day) => {
            const daySlots = MEAL_TYPES.map((mealType) => ({
              mealType,
              slot: slots.find((s) => s.day_of_week === day && s.meal_type === mealType),
            })).filter(({ slot }) => slot && slot.participant_profile_ids.length > 0);

            if (daySlots.length === 0) return null;

            return (
              <div key={day} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{dayOfWeekLabel(day)}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {daySlots.map(({ mealType, slot }) => {
                    const entry = entryByKey.get(`${day}:${mealType}`);
                    const participantIds = entry?.participant_profile_ids ?? slot!.participant_profile_ids;
                    const participants = participantIds
                      .map((id) => profileById.get(id))
                      .filter((p): p is NonNullable<typeof p> => !!p);
                    return (
                      <div key={mealType} className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {MEAL_TYPE_LABELS[mealType]}
                        </span>
                        <MealSlotCell
                          weekStart={weekStart}
                          dayOfWeek={day}
                          mealType={mealType}
                          recipe={entry?.recipe ?? null}
                          participants={participants}
                          calorieTargetByProfileId={calorieTargetByProfileId}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
