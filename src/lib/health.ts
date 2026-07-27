export type Sex = "homme" | "femme";
export type ActivityLevel = "sedentaire" | "leger" | "modere" | "actif" | "tres_actif";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire: "Sédentaire (bureau, peu de mouvement)",
  leger: "Légèrement actif (marche, 1-2 séances/semaine)",
  modere: "Modérément actif (3-4 séances/semaine)",
  actif: "Actif (travail physique ou sport régulier)",
  tres_actif: "Très actif (sport intense quotidien)",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

/** Mifflin-St Jeor — the standard, well-validated BMR formula. */
export function computeBmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "homme" ? base + 5 : base - 161;
}

export function computeTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export type CalorieTargetResult = {
  dailyTarget: number;
  estimatedWeeks: number;
  kgPerWeek: number;
  isAggressive: boolean;
};

/** ~7700 kcal per kg of body fat — the standard rule-of-thumb conversion. */
const KCAL_PER_KG = 7700;
const SAFE_PACE_KG_PER_WEEK = 0.5;

/**
 * If a duration is given, computes the daily deficit/surplus needed to hit
 * it; otherwise assumes a safe default pace (0.5 kg/week) and estimates the
 * duration instead. Flags "isAggressive" when the resulting daily calories
 * would fall below a safe floor (1200 women / 1500 men) — the UI shows a
 * warning rather than silently applying it.
 */
export function computeCalorieTarget(
  tdee: number,
  currentWeight: number,
  targetWeight: number,
  goalType: "perte_de_poids" | "prise_de_masse" | "maintien",
  durationMonths: number | null,
  sex: Sex | null
): CalorieTargetResult {
  const kgDiff = Math.abs(currentWeight - targetWeight);
  if (goalType === "maintien" || kgDiff < 0.1) {
    return { dailyTarget: Math.round(tdee), estimatedWeeks: 0, kgPerWeek: 0, isAggressive: false };
  }

  const totalKcal = kgDiff * KCAL_PER_KG;
  const days = durationMonths ? durationMonths * 30 : (kgDiff / SAFE_PACE_KG_PER_WEEK) * 7;
  const dailyDelta = totalKcal / days;
  const isLosing = goalType === "perte_de_poids";
  const dailyTarget = Math.round(isLosing ? tdee - dailyDelta : tdee + dailyDelta);
  const estimatedWeeks = days / 7;
  const kgPerWeek = kgDiff / estimatedWeeks;

  const floor = sex === "homme" ? 1500 : 1200;
  const isAggressive = isLosing && dailyTarget < floor;

  return { dailyTarget, estimatedWeeks, kgPerWeek, isAggressive };
}
