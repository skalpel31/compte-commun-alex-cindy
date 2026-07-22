import type { MealType, Recipe, RecipeIngredient } from "@/lib/types";

export const MEAL_TYPES: MealType[] = ["petit_dejeuner", "dejeuner", "gouter", "diner"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  gouter: "Goûter",
  diner: "Dîner",
};

/** Rough share of a day's calorie target each meal represents — used only to
 * split a personal daily target across meals for the portion calculator, not
 * a medical figure. Adjustable later if it needs to vary per person. */
export const MEAL_TYPE_CALORIE_SHARE: Record<MealType, number> = {
  petit_dejeuner: 0.25,
  dejeuner: 0.35,
  gouter: 0.1,
  diner: 0.3,
};

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export function dayOfWeekLabel(day: number): string {
  return DAY_LABELS[day] ?? "";
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + deltaWeeks * 7);
  return getWeekStart(d);
}

function ingredientKcal(ing: RecipeIngredient): number {
  return (ing.quantity_g / 100) * ing.kcal_per_100g;
}

/** Total calories of the recipe as written (its base `servings`). */
export function recipeTotalKcal(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => sum + ingredientKcal(ing), 0);
}

/** Calories the recipe's own base serving already represents per person. */
export function recipeKcalPerServing(recipe: Recipe): number {
  return recipe.servings > 0 ? recipeTotalKcal(recipe) / recipe.servings : 0;
}

/**
 * Scales every ingredient of a recipe to match one person's calorie target
 * for a given meal — e.g. Cindy's target for dîner vs Alex's target for the
 * same recipe come out as different gram amounts. Returns the recipe's own
 * per-serving amounts unscaled if the person has no calorie target set (or
 * the recipe has no ingredients/kcal at all) instead of dividing by zero.
 */
export function computePersonalPortion(
  recipe: Recipe,
  mealType: MealType,
  dailyCalorieTarget: number | null
): RecipeIngredient[] {
  const perServingKcal = recipeKcalPerServing(recipe);
  if (!dailyCalorieTarget || perServingKcal <= 0) {
    return recipe.ingredients.map((ing) => ({ ...ing, quantity_g: ing.quantity_g / Math.max(1, recipe.servings) }));
  }
  const personTargetForMeal = dailyCalorieTarget * MEAL_TYPE_CALORIE_SHARE[mealType];
  const scale = personTargetForMeal / perServingKcal;
  return recipe.ingredients.map((ing) => ({
    ...ing,
    quantity_g: Math.round((ing.quantity_g / Math.max(1, recipe.servings)) * scale),
  }));
}
