export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  user_id: string | null;
  claim_code: string | null;
  is_child: boolean;
};

export type Pocket = {
  id: string;
  name: string;
  icon: string;
  color: string;
  owner_id: string | null;
  custom_owner_label: string | null;
  allocation_pct: number;
  sort_order: number;
  receives_surplus: boolean;
  is_savings: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "expense" | "income";
  default_pocket_id: string | null;
  budget_rollover: boolean;
  is_savings: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  category_id: string | null;
  paid_by: string | null;
  pocket_id: string | null;
  split_type: "shared" | "personal";
  split_ratio: Record<string, number>;
  is_recurring: boolean;
  recurring_rule: string | null;
  created_at: string;
  category: Category | null;
  pocket: Pocket | null;
  receipt_url: string | null;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string;
  amount_limit: number;
  scope: "shared" | "personal";
  user_id: string | null;
  auto: boolean;
  category: Category | null;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  pocket_id: string | null;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  default_payer: string | null;
  pocket_id: string | null;
  split_type: "shared" | "personal";
  autopay: boolean;
  active: boolean;
  installments_total: number | null;
  final_amount: number | null;
  first_amount: number | null;
  start_date: string | null;
  receipt_url: string | null;
  category: Category | null;
};

export type HealthProfile = {
  profile_id: string;
  height_cm: number | null;
  target_weight_kg: number | null;
  daily_calorie_target: number | null;
  goal_type: "perte_de_poids" | "prise_de_masse" | "maintien" | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  updated_at: string;
};

export type WeightLog = {
  id: string;
  profile_id: string;
  date: string;
  weight_kg: number;
  measurements: Record<string, number> | null;
  note: string | null;
  created_at: string;
};

export type MealType = "petit_dejeuner" | "dejeuner" | "gouter" | "diner";

export type RecipeIngredient = {
  name: string;
  quantity_g: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
};

export type Recipe = {
  id: string;
  name: string;
  description: string | null;
  meal_types: MealType[];
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string | null;
  generated_by_ai: boolean;
  created_at: string;
};

export type MealSlot = {
  id: string;
  day_of_week: number;
  meal_type: MealType;
  participant_profile_ids: string[];
};

export type MealPlanEntry = {
  id: string;
  week_start: string;
  day_of_week: number;
  meal_type: MealType;
  recipe_id: string | null;
  participant_profile_ids: string[];
  recipe: Recipe | null;
};

export type ShoppingListItem = {
  id: string;
  week_start: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  source: "generated" | "manual";
};

export type RunPoint = { lat: number; lng: number; t: number };

export type Run = {
  id: string;
  profile_id: string;
  started_at: string;
  ended_at: string;
  distance_m: number;
  duration_s: number;
  route: RunPoint[];
  created_at: string;
  profile: Profile | null;
};

export type FitnessGoalTerm = "moyen_terme" | "long_terme";

export type FitnessGoal = {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  term: FitnessGoalTerm;
  target_date: string | null;
  achieved: boolean;
  created_at: string;
};

export type Exercise = {
  name: string;
  level_name: string;
  current_level: number;
  total_levels: number;
  sets: number;
  reps_or_duration: string;
  next_level_name: string | null;
  progression_criteria: string;
};

export type TrainingSession = {
  name: string;
  exercises: Exercise[];
};

export type TrainingProgram = {
  id: string;
  profile_id: string;
  level: "debutant" | "intermediaire" | "avance";
  has_pullup_bar: boolean;
  sessions_per_week: number;
  sessions: TrainingSession[];
  generated_by_ai: boolean;
  created_at: string;
};

export type WorkoutLog = {
  id: string;
  profile_id: string;
  program_id: string | null;
  date: string;
  notes: string | null;
  created_at: string;
};

export type BillWithStatus = Bill & {
  status: "paid" | "overdue" | "upcoming" | "later";
  dueDate: string;
  autoMarked: boolean;
  isFirstInstallment: boolean;
  installmentsPaid: number;
  isLastInstallment: boolean;
  effectiveAmount: number;
};
