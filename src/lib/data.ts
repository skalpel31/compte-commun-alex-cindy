import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, localDateString, localMonthString } from "@/lib/format";
import { installmentNumberFor } from "@/lib/bill-installments";
import { MEAL_TYPES } from "@/lib/nutrition";
import type {
  Bill,
  BillWithStatus,
  Budget,
  Category,
  Goal,
  HealthProfile,
  MealPlanEntry,
  MealSlot,
  MealType,
  Pocket,
  Profile,
  FitnessGoal,
  Recipe,
  Run,
  ShoppingListItem,
  Transaction,
  TrainingProgram,
  WeightLog,
  WorkoutLog,
} from "@/lib/types";

/**
 * RLS scopes every read to the caller's own household automatically, but
 * writes still need the value on hand to set on inserts. Cached per request
 * so multiple calls in the same server render/action don't re-query.
 */
export const getCurrentHouseholdId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { data, error } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (error || !data) throw new Error("Foyer introuvable pour cet utilisateur");
  return data.household_id as string;
});

export async function getHousehold(): Promise<{ id: string; name: string; invite_code: string }> {
  const supabase = await createClient();
  const household_id = await getCurrentHouseholdId();
  const { data, error } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .eq("id", household_id)
    .single();
  if (error || !data) throw new Error("Foyer introuvable");
  return data;
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return data ?? [];
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Every profile whose health data I'm allowed to see — myself, plus any
 * memberless profile (a child) in my household. RLS on health_profiles/
 * weight_logs enforces the same rule on writes, but profiles itself has no
 * such restriction, so this filters in app code to match what the health
 * tables will actually let me read.
 */
export async function getVisibleHealthProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profiles = await getProfiles();
  return profiles.filter((p) => p.user_id === user?.id || p.user_id === null);
}

export async function getAllHealthProfiles(): Promise<HealthProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("health_profiles").select("*");
  return (data as HealthProfile[] | null) ?? [];
}

export async function getHealthProfile(profileId: string): Promise<HealthProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data;
}

export async function getWeightLogs(profileId: string): Promise<WeightLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false });
  return data ?? [];
}

export async function getPockets(): Promise<Pocket[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pockets").select("*").order("sort_order");
  return data ?? [];
}

export type PocketBalance = Pocket & { balance: number; totalSpent: number; sparkline: number[] };

export type PocketBalanceTxRow = {
  amount: number;
  date: string;
  pocket_id: string | null;
  category: { type: string } | null;
};

/** Pure so the admin read-only preview (which fetches via a service-role
 * client scoped to an arbitrary household) can reuse the exact same balance
 * math instead of drifting out of sync with the real dashboard. */
export function computePocketBalances(
  pockets: Pocket[],
  txs: PocketBalanceTxRow[]
): PocketBalance[] {
  const days = 14;
  const today = new Date();
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayKeys.push(localDateString(d));
  }

  return pockets.map((p) => {
    const pocketTxs = txs.filter((t) => t.pocket_id === p.id);
    const signed = (t: PocketBalanceTxRow) => (t.category?.type === "income" ? 1 : -1) * t.amount;
    const balance = pocketTxs.reduce((sum, t) => sum + signed(t), 0);
    const totalSpent = pocketTxs
      .filter((t) => t.category?.type !== "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const before = pocketTxs
      .filter((t) => t.date < dayKeys[0])
      .reduce((sum, t) => sum + signed(t), 0);
    const sparkline: number[] = [];
    let running = before;
    for (const key of dayKeys) {
      running += pocketTxs.filter((t) => t.date === key).reduce((sum, t) => sum + signed(t), 0);
      sparkline.push(running);
    }

    return { ...p, balance, totalSpent, sparkline };
  });
}

export async function getPocketBalances(): Promise<PocketBalance[]> {
  const supabase = await createClient();
  const [{ data: pockets }, { data: rows }] = await Promise.all([
    supabase.from("pockets").select("*").order("sort_order"),
    supabase
      .from("transactions")
      .select("amount, date, pocket_id, category:categories(type)")
      .order("date"),
  ]);

  return computePocketBalances(
    (pockets as Pocket[] | null) ?? [],
    (rows as PocketBalanceTxRow[] | null) ?? []
  );
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), pocket:pockets(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data as Transaction[] | null) ?? [];
}

/** Every deposit ever made into a given (savings) pocket — used by the Épargne detail page to list contributions rather than just showing the running balance. */
export async function getPocketContributions(pocketId: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, category:categories(*), pocket:pockets(*)")
    .eq("pocket_id", pocketId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  return ((data as Transaction[] | null) ?? []).filter((t) => t.category?.type === "income");
}

export async function getMonthTransactions(month = currentMonth()): Promise<Transaction[]> {
  const supabase = await createClient();
  const [year, monthNum] = month.split("-").map(Number);
  const start = month;
  const end = `${monthNum === 12 ? year + 1 : year}-${String(monthNum === 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;
  const { data } = await supabase
    .from("transactions")
    .select("*, category:categories(*), pocket:pockets(*)")
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false });
  return (data as Transaction[] | null) ?? [];
}

export async function getBudgets(month = currentMonth()): Promise<Budget[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("month", month);
  return (data as Budget[] | null) ?? [];
}

function monthsBetweenInclusive(startMonth: string, endMonth: string): number {
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

export type RollingBudgetInfo = {
  /** Total budget accrued since rollover started (monthsElapsed × the budget amount) — this is the header/progress-bar denominator, not just this month's limit. */
  cumulativeTotal: number;
  /** Everything spent in this category since rollover started, not just this calendar month — matches cumulativeTotal's basis so the ratio is meaningful. */
  cumulativeSpent: number;
  /** What's left to spend. Legitimately 0 (or negative) once fully used — callers must not treat 0 as "no budget set". */
  available: number;
};

/**
 * For categories flagged "budget_rollover" (ex: Clopes, Courses...), the
 * amount available this month isn't just this month's limit — it's every
 * month's base limit since the budget started, minus everything actually
 * spent since then. So underspending one month grows what's available the
 * next, instead of resetting. Returns cumulative totals keyed by category id.
 */
export async function getRollingBudgetAvailable(
  categoryIds: string[],
  month = currentMonth()
): Promise<Record<string, RollingBudgetInfo>> {
  if (categoryIds.length === 0) return {};
  const supabase = await createClient();

  const { data: allBudgets } = await supabase
    .from("budgets")
    .select("category_id, month, amount_limit")
    .in("category_id", categoryIds)
    .order("month");
  const byCategory = new Map<string, { month: string; amount_limit: number }[]>();
  for (const b of allBudgets ?? []) {
    byCategory.set(b.category_id, [...(byCategory.get(b.category_id) ?? []), b]);
  }

  const result: Record<string, RollingBudgetInfo> = {};
  for (const categoryId of categoryIds) {
    const rows = byCategory.get(categoryId);
    if (!rows || rows.length === 0) continue;
    const startMonth = rows[0].month;
    const currentOrLatest = [...rows].reverse().find((r) => r.month <= month) ?? rows[0];
    const monthsElapsed = monthsBetweenInclusive(startMonth, month);
    const baseAmount = Number(currentOrLatest.amount_limit);

    const { data: spendRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("category_id", categoryId)
      .gte("date", startMonth);
    const totalSpent = (spendRows ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

    const cumulativeTotal = monthsElapsed * baseAmount;
    result[categoryId] = {
      cumulativeTotal,
      cumulativeSpent: totalSpent,
      available: cumulativeTotal - totalSpent,
    };
  }
  return result;
}

export type PlannedSpend = {
  fixedCharges: number;
  discretionaryBudgets: Budget[];
  discretionaryTotal: number;
  /** Safe to display or compare against income — never double-counts a
   * category that has both a bill and a leftover manual budget. */
  total: number;
};

/**
 * A category can end up with both an active bill AND a manually-set budget
 * (someone types a number instead of leaving it in "auto") — summing "toutes
 * les factures" and "tous les budgets manuels" separately then adds that
 * category's spend twice. This is the one place that combines them, so any
 * category with a bill is always represented by its bill only; every caller
 * (dashboard, an "am I over budget" check) gets a total that can't drift back
 * into double-counting even if that overlap recurs on new categories later.
 */
export function computePlannedSpend(bills: BillWithStatus[], budgets: Budget[]): PlannedSpend {
  const fixedCharges = bills.reduce((s, b) => s + b.effectiveAmount, 0);
  const categoriesWithBills = new Set(bills.map((b) => b.category_id).filter((id): id is string => !!id));
  const discretionaryBudgets = budgets.filter(
    (b) => !b.auto && b.category?.type === "expense" && !categoriesWithBills.has(b.category_id)
  );
  const discretionaryTotal = discretionaryBudgets.reduce((s, b) => s + b.amount_limit, 0);
  return {
    fixedCharges,
    discretionaryBudgets,
    discretionaryTotal,
    total: fixedCharges + discretionaryTotal,
  };
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  return (data as Recipe[] | null) ?? [];
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
  return data as Recipe | null;
}

/**
 * The weekly meal-slot template, one row per (day, meal type). Any
 * combination not yet customized in the DB defaults to "everyone in the
 * household eats this", synthesized here rather than seeded by a migration
 * — so a brand new household gets a sensible default with zero setup, and
 * the default follows the household's actual member list even as it grows.
 */
export async function getMealSlots(): Promise<MealSlot[]> {
  const supabase = await createClient();
  const [{ data: slots }, profiles] = await Promise.all([
    supabase.from("meal_slots").select("*"),
    getProfiles(),
  ]);
  const allProfileIds = profiles.map((p) => p.id);
  const byKey = new Map((slots ?? []).map((s) => [`${s.day_of_week}:${s.meal_type}`, s as MealSlot]));

  const result: MealSlot[] = [];
  for (let day = 0; day < 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const key = `${day}:${mealType}`;
      result.push(
        byKey.get(key) ?? {
          id: `default-${key}`,
          day_of_week: day,
          meal_type: mealType as MealType,
          // Only dinner defaults to "everyone, every day" — the one meal
          // virtually every household actually shares daily. Every other
          // slot defaults to nobody until explicitly configured, so a fresh
          // household starts with 7 slots to fill instead of 28.
          participant_profile_ids: mealType === "diner" ? allProfileIds : [],
        }
      );
    }
  }
  return result;
}

export async function getMealPlanEntries(weekStart: string): Promise<MealPlanEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_plan_entries")
    .select("*, recipe:recipes(*)")
    .eq("week_start", weekStart);
  return (data as MealPlanEntry[] | null) ?? [];
}

export async function getShoppingList(weekStart: string): Promise<ShoppingListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("week_start", weekStart)
    .order("created_at");
  return (data as ShoppingListItem[] | null) ?? [];
}

export async function getFitnessGoals(profileId: string): Promise<FitnessGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fitness_goals")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return (data as FitnessGoal[] | null) ?? [];
}

export async function getLatestTrainingProgram(profileId: string): Promise<TrainingProgram | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_programs")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as TrainingProgram | null;
}

export async function getWorkoutLogs(profileId: string): Promise<WorkoutLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false });
  return (data as WorkoutLog[] | null) ?? [];
}

export async function getRuns(): Promise<Run[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("runs")
    .select("*, profile:profiles(*)")
    .order("started_at", { ascending: false });
  return (data as Run[] | null) ?? [];
}

export async function getRun(id: string): Promise<Run | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("runs").select("*, profile:profiles(*)").eq("id", id).maybeSingle();
  return data as Run | null;
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("goals").select("*").order("created_at");
  return data ?? [];
}

export async function getMonthlySpend(monthsBack = 6) {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const { data } = await supabase
    .from("transactions")
    .select("amount, date, category:categories(type)")
    .gte("date", localDateString(start));

  const months: { month: string; total: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: localMonthString(d), total: 0 });
  }

  type Row = { amount: number; date: string; category: { type: string } | null };
  for (const row of (data as Row[] | null) ?? []) {
    if (row.category?.type === "income") continue;
    const key = row.date.slice(0, 7);
    const bucket = months.find((m) => m.month === key);
    if (bucket) bucket.total += row.amount;
  }

  return months;
}

export async function withBillStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bills: Bill[]
): Promise<BillWithStatus[]> {
  const month = currentMonth();
  const billIds = bills.map((b) => b.id);
  const [{ data: payments }, { data: allPayments }] = await Promise.all([
    supabase.from("bill_payments").select("bill_id, paid_at, auto").eq("month", month).in("bill_id", billIds),
    supabase.from("bill_payments").select("bill_id").not("paid_at", "is", null).in("bill_id", billIds),
  ]);

  const today = new Date();
  const todayStr = localDateString(today);
  const paidByBillId = new Map((payments ?? []).filter((p) => p.paid_at).map((p) => [p.bill_id as string, p]));
  const paidCountByBillId = new Map<string, number>();
  for (const p of allPayments ?? []) {
    paidCountByBillId.set(p.bill_id, (paidCountByBillId.get(p.bill_id) ?? 0) + 1);
  }

  return bills.map((bill) => {
    const dueDate = `${month.slice(0, 7)}-${String(bill.due_day).padStart(2, "0")}`;
    const payment = paidByBillId.get(bill.id);
    let status: BillWithStatus["status"];
    if (payment) status = "paid";
    else if (dueDate < todayStr) status = "overdue";
    else {
      const diffDays = Math.round(
        (new Date(dueDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) /
          86_400_000
      );
      status = diffDays <= 5 ? "upcoming" : "later";
    }

    // Installment progress is date-driven (not a count of app-recorded
    // payments) so a credit already underway can be added with its real
    // start date and the count reflects reality immediately.
    const currentInstallment = bill.start_date
      ? installmentNumberFor(bill.start_date)
      : (paidCountByBillId.get(bill.id) ?? 0) + 1;
    const installmentsPaid = Math.max(0, currentInstallment - 1);
    const isFirstInstallment = !!bill.installments_total && currentInstallment <= 1;
    const isLastInstallment = !!bill.installments_total && currentInstallment >= bill.installments_total;
    const effectiveAmount =
      isFirstInstallment && bill.first_amount != null
        ? bill.first_amount
        : isLastInstallment && bill.final_amount != null
          ? bill.final_amount
          : bill.amount;

    return {
      ...bill,
      status,
      dueDate,
      autoMarked: !!payment?.auto,
      installmentsPaid,
      isFirstInstallment,
      isLastInstallment,
      effectiveAmount,
    };
  });
}

export type SavingsBillTotal = {
  billId: string;
  billName: string;
  monthlyAmount: number;
  pocketId: string | null;
  totalPaid: number;
  paymentsCount: number;
};

/**
 * Some savings aren't a pocket the app holds a balance for — they're a
 * recurring bill that transfers a fixed amount to an external Livret A each
 * month (one per family member, say). Rather than one meaningless combined
 * total across unrelated livrets, this returns each such bill's OWN
 * cumulative total paid to date, for the Épargne page to list separately.
 */
export async function getSavingsBillTotals(): Promise<SavingsBillTotal[]> {
  const supabase = await createClient();
  const { data: bills } = await supabase
    .from("bills")
    .select("id, name, amount, pocket_id, category:categories(is_savings)")
    .eq("active", true);
  const savingsBills = (bills ?? []).filter(
    (b) => (b.category as unknown as { is_savings: boolean } | null)?.is_savings
  );
  if (savingsBills.length === 0) return [];

  const billIds = savingsBills.map((b) => b.id);
  const { data: payments } = await supabase
    .from("bill_payments")
    .select("bill_id, transaction_id")
    .in("bill_id", billIds)
    .not("transaction_id", "is", null);

  const txIds = (payments ?? []).map((p) => p.transaction_id as string);
  const { data: txs } =
    txIds.length > 0
      ? await supabase.from("transactions").select("id, amount").in("id", txIds)
      : { data: [] as { id: string; amount: number }[] };
  const amountByTx = new Map((txs ?? []).map((t) => [t.id, t.amount]));

  const totalsByBill = new Map<string, { total: number; count: number }>();
  for (const p of payments ?? []) {
    const amount = p.transaction_id ? (amountByTx.get(p.transaction_id) ?? 0) : 0;
    const existing = totalsByBill.get(p.bill_id) ?? { total: 0, count: 0 };
    totalsByBill.set(p.bill_id, { total: existing.total + amount, count: existing.count + 1 });
  }

  return savingsBills.map((b) => {
    const t = totalsByBill.get(b.id) ?? { total: 0, count: 0 };
    return {
      billId: b.id,
      billName: b.name,
      monthlyAmount: b.amount,
      pocketId: b.pocket_id,
      totalPaid: t.total,
      paymentsCount: t.count,
    };
  });
}

export type SavingsBillPayment = { month: string; paidAt: string | null; amount: number };

export async function getSavingsBillPayments(billId: string): Promise<SavingsBillPayment[]> {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("bill_payments")
    .select("month, paid_at, transaction_id")
    .eq("bill_id", billId)
    .order("month", { ascending: false });

  const txIds = (payments ?? []).map((p) => p.transaction_id).filter((id): id is string => !!id);
  const { data: txs } =
    txIds.length > 0
      ? await supabase.from("transactions").select("id, amount").in("id", txIds)
      : { data: [] as { id: string; amount: number }[] };
  const amountByTx = new Map((txs ?? []).map((t) => [t.id, t.amount]));

  return (payments ?? []).map((p) => ({
    month: p.month,
    paidAt: p.paid_at,
    amount: p.transaction_id ? (amountByTx.get(p.transaction_id) ?? 0) : 0,
  }));
}

export async function getBills(): Promise<BillWithStatus[]> {
  const supabase = await createClient();
  const { data: bills } = await supabase
    .from("bills")
    .select("*, category:categories(*)")
    .eq("active", true)
    .order("due_day");
  return withBillStatus(supabase, (bills as Bill[] | null) ?? []);
}

/**
 * How much each account needs to cover, per month, just from its recurring
 * bills — the same pocket-resolution rule used when a bill actually gets
 * paid (its own pocket_id, falling back to its category's default). Feeds
 * the "suggest my %" tool so allocations are based on real charges instead
 * of a guess.
 */
export async function getBillsTotalByPocket(): Promise<Record<string, number>> {
  const bills = await getBills();
  const totals: Record<string, number> = {};
  for (const b of bills) {
    const pocketId = b.pocket_id ?? b.category?.default_pocket_id ?? null;
    if (!pocketId) continue;
    totals[pocketId] = (totals[pocketId] ?? 0) + Number(b.amount);
  }
  return totals;
}

/** Installment bills that finished their last payment — kept reachable so a wrong final payment can still be undone. */
export async function getCompletedBills(): Promise<BillWithStatus[]> {
  const supabase = await createClient();
  const { data: bills } = await supabase
    .from("bills")
    .select("*, category:categories(*)")
    .eq("active", false)
    .not("installments_total", "is", null)
    .order("due_day");
  const withStatus = await withBillStatus(supabase, (bills as Bill[] | null) ?? []);

  // These bills are only ever inactive because their last installment was
  // paid — force "paid" regardless of which month that landed in, since the
  // current-month lookup in withBillStatus won't find a payment made in a
  // prior month.
  const billIds = withStatus.map((b) => b.id);
  const { data: lastPayments } = billIds.length
    ? await supabase
        .from("bill_payments")
        .select("bill_id, auto")
        .in("bill_id", billIds)
        .not("paid_at", "is", null)
        .order("month", { ascending: false })
    : { data: [] };
  const autoByBillId = new Map<string, boolean>();
  for (const p of lastPayments ?? []) {
    if (!autoByBillId.has(p.bill_id)) autoByBillId.set(p.bill_id, p.auto);
  }

  return withStatus.map((b) => ({
    ...b,
    status: "paid" as const,
    autoMarked: autoByBillId.get(b.id) ?? false,
  }));
}

export type Contribution = {
  profile: Profile;
  paid: number;
};

export async function getContributions(
  month = currentMonth()
): Promise<{ contributions: Contribution[]; total: number }> {
  const [profiles, transactions] = await Promise.all([getProfiles(), getMonthTransactions(month)]);
  const expenses = transactions.filter((t) => t.category?.type !== "income");
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  const contributions = profiles.map((profile) => ({
    profile,
    paid: expenses.filter((t) => t.paid_by === profile.id).reduce((sum, t) => sum + t.amount, 0),
  }));

  return { contributions, total };
}

export type IncomeSource = {
  label: string;
  amount: number;
  paidBy: string | null;
  transactionIds: string[];
  date: string;
  categoryId: string | null;
};

const JOINT_SOURCE_KEY = "joint";

export async function getMonthIncome(
  month = currentMonth()
): Promise<{
  sources: IncomeSource[];
  total: number;
  byPocket: Record<string, number>;
  byPayerPocket: Record<string, Record<string, number>>;
}> {
  const transactions = await getMonthTransactions(month);
  const income = transactions.filter((t) => t.category?.type === "income");
  const total = income.reduce((sum, t) => sum + t.amount, 0);

  const byLabel = new Map<
    string,
    { amount: number; paidBy: string | null; transactionIds: string[]; date: string; categoryId: string | null }
  >();
  const byPocket: Record<string, number> = {};
  const byPayerPocket: Record<string, Record<string, number>> = {};
  for (const t of income) {
    const label = t.description || t.category?.name || "Revenu";
    const existing = byLabel.get(label);
    byLabel.set(label, {
      amount: (existing?.amount ?? 0) + t.amount,
      paidBy: t.paid_by,
      transactionIds: [...(existing?.transactionIds ?? []), t.id],
      date: t.date,
      categoryId: t.category_id,
    });
    if (t.pocket_id) {
      byPocket[t.pocket_id] = (byPocket[t.pocket_id] ?? 0) + t.amount;
      const payerKey = t.paid_by ?? JOINT_SOURCE_KEY;
      const forPayer = byPayerPocket[payerKey] ?? {};
      forPayer[t.pocket_id] = (forPayer[t.pocket_id] ?? 0) + t.amount;
      byPayerPocket[payerKey] = forPayer;
    }
  }

  return {
    sources: Array.from(byLabel, ([label, v]) => ({
      label,
      amount: v.amount,
      paidBy: v.paidBy,
      transactionIds: v.transactionIds,
      date: v.date,
      categoryId: v.categoryId,
    })),
    total,
    byPocket,
    byPayerPocket,
  };
}

