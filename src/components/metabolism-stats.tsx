import { TrendingDown, TrendingUp, Target } from "lucide-react";
import { computeBmr, computeCalorieTarget, computeTdee } from "@/lib/health";
import type { HealthProfile } from "@/lib/types";

export function MetabolismStats({
  healthProfile,
  currentWeight,
}: {
  healthProfile: HealthProfile;
  currentWeight: number;
}) {
  if (!healthProfile.height_cm || !healthProfile.age || !healthProfile.sex || !healthProfile.activity_level) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Renseigne ta taille, ton âge, ton sexe et ton niveau d&apos;activité ci-dessous pour calculer
        automatiquement tes calories.
      </div>
    );
  }

  const bmr = computeBmr(currentWeight, healthProfile.height_cm, healthProfile.age, healthProfile.sex);
  const tdee = computeTdee(bmr, healthProfile.activity_level);
  const target = healthProfile.target_weight_kg ?? currentWeight;
  const goalType = healthProfile.goal_type ?? "maintien";
  const result = computeCalorieTarget(
    tdee,
    currentWeight,
    target,
    goalType,
    healthProfile.goal_duration_months,
    healthProfile.sex
  );

  return (
    <div className="flex flex-col gap-3">
      {result.estimatedWeeks > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-sm">
            {goalType === "perte_de_poids" ? (
              <TrendingDown className="size-4 text-good" />
            ) : (
              <TrendingUp className="size-4 text-primary" />
            )}
            <span>
              {goalType === "perte_de_poids" ? "Ne dépasse pas" : "Vise au moins"}{" "}
              <span className="font-semibold">{result.dailyTarget} kcal/jour</span> pour ton objectif.
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="size-4" />
            <span>
              Temps estimé : ~{Math.round(result.estimatedWeeks / 4.3)} mois (~{result.kgPerWeek.toFixed(2)}{" "}
              kg/semaine)
            </span>
          </div>
          {result.isAggressive && (
            <p className="text-xs text-critical">
              Ce rythme est agressif — un déficit aussi marqué n&apos;est pas recommandé sans avis médical.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Métabolisme de base</p>
          <p className="text-lg font-semibold tabular-nums">{Math.round(bmr)} kcal</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Dépense totale (TDEE)</p>
          <p className="text-lg font-semibold tabular-nums">{Math.round(tdee)} kcal</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Objectif calorique</p>
          <p className="text-lg font-semibold tabular-nums">{result.dailyTarget} kcal</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Poids actuel</p>
          <p className="text-lg font-semibold tabular-nums">{currentWeight} kg</p>
        </div>
      </div>
    </div>
  );
}
