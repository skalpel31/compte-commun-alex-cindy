"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHouseholdId } from "@/lib/data";
import { currentMonth, localDateString } from "@/lib/format";
import { installmentNumberFor } from "@/lib/bill-installments";
import { JOINT_PAYER } from "@/lib/payer";
import { computeIncomeSplit } from "@/lib/income-split";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Every page that derives its numbers from transactions/bills/pockets/goals,
 * so a write anywhere keeps all of them in sync instead of showing stale
 * router-cached data on the pages added after the initial set.
 */
function revalidateMoneyPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settle");
  revalidatePath("/comptes");
  revalidatePath("/flux-argent");
  revalidatePath("/objectifs");
  revalidatePath("/epargne");
  revalidatePath("/simulations");
  revalidatePath("/conseiller-ia");
  revalidatePath("/alertes");
  revalidatePath("/bills");
}

/**
 * Keeps a category's current-month budget in sync with the sum of its
 * active bills — unless the user has manually customized that budget
 * (auto = false), in which case their number wins.
 */
async function syncCategoryBudgetFromBills(
  supabase: SupabaseClient,
  categoryId: string | null,
  opts?: { force?: boolean; month?: string }
) {
  if (!categoryId) return;
  const month = opts?.month ?? currentMonth();

  const { data: bills } = await supabase
    .from("bills")
    .select("amount")
    .eq("category_id", categoryId)
    .eq("active", true);
  const total = (bills ?? []).reduce((sum, b) => sum + Number(b.amount), 0);

  const { data: existing } = await supabase
    .from("budgets")
    .select("id, auto")
    .eq("category_id", categoryId)
    .eq("month", month)
    .maybeSingle();

  if (total <= 0) {
    // Nothing to compute yet — a forced switch-to-auto with no bills just
    // clears any manual number, so the budget re-appears on its own the
    // moment a bill lands in this category.
    if (existing && (existing.auto || opts?.force)) {
      await supabase.from("budgets").delete().eq("id", existing.id);
    }
    return;
  }

  if (!existing) {
    await supabase.from("budgets").insert({
      category_id: categoryId,
      month,
      amount_limit: total,
      scope: "shared",
      user_id: null,
      auto: true,
      household_id: await getCurrentHouseholdId(),
    });
  } else if (existing.auto || opts?.force) {
    await supabase.from("budgets").update({ amount_limit: total, auto: true }).eq("id", existing.id);
  }
}

/**
 * Explicit toggle for the "auto" entry point on a budget row — lets a
 * manually-set budget switch back to being computed from that category's
 * bills, or freeze at its current computed amount.
 */
export async function setBudgetAuto(categoryId: string, auto: boolean, month = currentMonth()) {
  const supabase = await createClient();
  if (auto) {
    await syncCategoryBudgetFromBills(supabase, categoryId, { force: true, month });
  } else {
    await supabase
      .from("budgets")
      .update({ auto: false })
      .eq("category_id", categoryId)
      .eq("month", month);
  }
  revalidateMoneyPaths();
}

export type TransactionInput = {
  amount: number;
  description: string;
  date: string;
  category_id: string;
  paid_by: string | null;
  pocket_id: string | null;
};

/**
 * A personal pocket only gets funded by its own owner's income — the
 * percentage that would've gone to the other partner's personal pocket is
 * instead split evenly across pockets flagged "receives_surplus" (e.g. kids'
 * livrets), so those can be added without rebalancing the base 100% split.
 * If none are flagged, it falls back to the payer's own personal pocket so
 * no percentage is silently lost. Income attributed to Compte Joint itself
 * (no personal payer) skips this redirection entirely and splits at the
 * plain percentages.
 */
async function buildIncomeSplitRows(
  supabase: SupabaseClient,
  base: Record<string, unknown>,
  amount: number,
  payerId: string | null
) {
  const { data: allPockets } = await supabase
    .from("pockets")
    .select("id, allocation_pct, owner_id, receives_surplus");
  const pockets = allPockets ?? [];
  const household_id = await getCurrentHouseholdId();

  const split = computeIncomeSplit(pockets, payerId, amount);
  if (split.length === 0) {
    // No pockets to split into yet — record the full amount unallocated
    // instead of blocking. Once pockets exist, "Recalculer ce mois" re-splits
    // every income entry of the month against whatever accounts are set up
    // by then, so nothing has to be re-typed.
    return [{ ...base, amount, pocket_id: null as string | null, household_id }];
  }
  return split.map((s) => ({ ...base, amount: s.amount, pocket_id: s.pocketId as string | null, household_id }));
}

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("type, default_pocket_id")
    .eq("id", input.category_id)
    .single();

  const base = {
    amount: input.amount,
    description: input.description,
    date: input.date,
    category_id: input.category_id,
    paid_by: input.paid_by,
    split_type: "shared" as const,
    split_ratio: {},
  };

  if (category?.type === "income") {
    const rows = await buildIncomeSplitRows(supabase, base, input.amount, input.paid_by);
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) throw new Error(error.message);
  } else {
    const pocket_id = input.pocket_id ?? category?.default_pocket_id ?? null;
    const { error } = await supabase
      .from("transactions")
      .insert({ ...base, pocket_id, household_id: await getCurrentHouseholdId() });
    if (error) throw new Error(error.message);
  }

  revalidateMoneyPaths();
}

/**
 * The simplest possible way to log a paycheck: pick who, type the amount,
 * optionally adjust the date and add a short note (e.g. "Pro BTP", "Sécu")
 * — useful when a salary arrives split across several payments from
 * different sources in the same month. No category picker needed — this
 * creates (or reuses) a single shared "Salaire" income category
 * automatically, and labels it "Salaire {prénom}" (plus the note, if any)
 * so it still groups nicely on the ledger and in the money-flow view. If no
 * pockets exist yet, the amount is recorded unallocated (see
 * buildIncomeSplitRows) until the user sets accounts up and recalculates.
 */
export async function addSalary(input: { payerId: string; amount: number; date?: string; note?: string }) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", input.payerId)
    .single();
  if (!profile) throw new Error("Profil introuvable");

  let { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("type", "income")
    .eq("name", "Salaire")
    .maybeSingle();

  if (!category) {
    const { data: created, error } = await supabase
      .from("categories")
      .insert({
        name: "Salaire",
        icon: "wallet",
        color: "chart-8",
        type: "income",
        household_id: await getCurrentHouseholdId(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    category = created;
  }

  const note = input.note?.trim();
  const base = {
    amount: input.amount,
    description: note ? `Salaire ${profile.display_name} — ${note}` : `Salaire ${profile.display_name}`,
    date: input.date || localDateString(new Date()),
    category_id: category.id,
    paid_by: input.payerId,
    split_type: "shared" as const,
    split_ratio: {},
  };
  const rows = await buildIncomeSplitRows(supabase, base, input.amount, input.payerId);
  const { error: insertError } = await supabase.from("transactions").insert(rows);
  if (insertError) throw new Error(insertError.message);

  revalidateMoneyPaths();
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

/** Deletes every row of a split income entry (one per pocket) as a single unit. */
export async function deleteTransactions(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export type IncomeGroupInput = {
  transactionIds: string[];
  amount: number;
  description: string;
  date: string;
  category_id: string;
  paid_by: string | null;
};

/**
 * An income entry is stored as one transaction row per pocket (see
 * createTransaction), so editing "the salary" means replacing that whole
 * group at once: delete the old split rows, then rebuild them at the new
 * amount with the same split logic (so surplus/redirect rules still apply).
 */
export async function updateIncomeAmount(input: IncomeGroupInput) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .in("id", input.transactionIds);
  if (deleteError) throw new Error(deleteError.message);

  const base = {
    description: input.description,
    date: input.date,
    category_id: input.category_id,
    paid_by: input.paid_by,
    split_type: "shared" as const,
    split_ratio: {},
  };
  const rows = await buildIncomeSplitRows(supabase, base, input.amount, input.paid_by);
  const { error: insertError } = await supabase.from("transactions").insert(rows);
  if (insertError) throw new Error(insertError.message);

  revalidateMoneyPaths();
}

/**
 * Changing a pocket's allocation % (or the receives_surplus flags) only
 * affects income entered from that point on — already-recorded transactions
 * keep the split amounts they were created with. This re-splits every
 * income entry of the given month at today's percentages, so a % change can
 * be applied retroactively to the current month without re-typing salaries.
 */
export async function recalculateMonthIncome(month = currentMonth()) {
  const supabase = await createClient();

  const { data: incomeCategoryIds } = await supabase.from("categories").select("id").eq("type", "income");
  const categoryIds = (incomeCategoryIds ?? []).map((c) => c.id);
  if (categoryIds.length === 0) return;

  const [year, monthNum] = month.split("-").map(Number);
  const start = month;
  const end = `${monthNum === 12 ? year + 1 : year}-${String(monthNum === 12 ? 1 : monthNum + 1).padStart(2, "0")}-01`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, description, date, category_id, paid_by")
    .in("category_id", categoryIds)
    .gte("date", start)
    .lt("date", end);
  if (!transactions || transactions.length === 0) return;

  type Row = { id: string; amount: number; description: string | null; date: string; category_id: string | null; paid_by: string | null };
  const groups = new Map<string, Row[]>();
  for (const t of transactions as Row[]) {
    const key = `${t.date}|${t.description ?? ""}|${t.category_id}|${t.paid_by ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  for (const rows of groups.values()) {
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    const first = rows[0];
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .in("id", rows.map((r) => r.id));
    if (deleteError) throw new Error(deleteError.message);

    const base = {
      description: first.description,
      date: first.date,
      category_id: first.category_id,
      paid_by: first.paid_by,
      split_type: "shared" as const,
      split_ratio: {},
    };
    const newRows = await buildIncomeSplitRows(supabase, base, total, first.paid_by);
    const { error: insertError } = await supabase.from("transactions").insert(newRows);
    if (insertError) throw new Error(insertError.message);
  }

  revalidateMoneyPaths();
}

/**
 * Editing a bill's account (pocket), category, or default payer only
 * changes what happens on FUTURE payments — a bill already marked paid this
 * month keeps the pocket/category/payer it was paid with at that moment.
 * This re-points every already-paid transaction of the month to whatever
 * account/category/payer its bill is currently set to, so correcting a
 * bill's details retroactively fixes both the account balance and the
 * category's "spent" total it should have hit.
 */
export async function resyncBillPayments(month = currentMonth()) {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("bill_payments")
    .select("bill_id, transaction_id")
    .eq("month", month)
    .not("transaction_id", "is", null);
  if (!payments || payments.length === 0) return 0;

  const billIds = [...new Set(payments.map((p) => p.bill_id))];
  const { data: bills } = await supabase
    .from("bills")
    .select("id, pocket_id, category_id, default_payer")
    .in("id", billIds);
  const billMap = new Map((bills ?? []).map((b) => [b.id, b]));

  let updated = 0;
  for (const p of payments) {
    const bill = billMap.get(p.bill_id);
    if (!bill || !p.transaction_id) continue;
    const update: { pocket_id: string | null; category_id: string | null; paid_by?: string | null } = {
      pocket_id: bill.pocket_id,
      category_id: bill.category_id,
    };
    if (bill.default_payer) {
      update.paid_by = bill.default_payer === JOINT_PAYER ? null : bill.default_payer;
    }
    const { error } = await supabase.from("transactions").update(update).eq("id", p.transaction_id);
    if (error) throw new Error(error.message);
    updated++;
  }

  revalidateMoneyPaths();
  return updated;
}

export type BudgetInput = {
  category_id: string;
  amount_limit: number;
  scope: "shared" | "personal";
  user_id: string | null;
  month?: string;
};

export async function upsertBudget(input: BudgetInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        ...input,
        month: input.month ?? currentMonth(),
        auto: false,
        household_id: await getCurrentHouseholdId(),
      },
      { onConflict: "category_id,month" }
    );
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export type CategoryInput = {
  id?: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  default_pocket_id: string | null;
};

export async function upsertCategory(input: CategoryInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .upsert({ ...input, household_id: await getCurrentHouseholdId() });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function updateCategoryIcon(id: string, icon: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ icon }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function renameCategory(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom ne peut pas être vide");
  const { error } = await supabase.from("categories").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

const CATEGORY_COLOR_SLOTS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
];

/**
 * Creates a brand-new expense category together with its first budget in one
 * action, for the "+ Nouveau budget" entry point on the Budgets page — that
 * page only ever offers budgets for categories that don't have one yet, so
 * once every existing category is covered the only way to add another
 * budget is to add the category it belongs to.
 *
 * The amount is optional: leaving it out just creates the category with no
 * fixed budget, so it starts (and stays) in "auto" mode — the moment a bill
 * is tagged with this category, syncCategoryBudgetFromBills fills it in on
 * its own instead of requiring a number up front.
 */
export async function createBudgetCategory(
  name: string,
  icon: string,
  amount_limit: number | null,
  month?: string,
  scope: "shared" | "personal" = "shared",
  user_id: string | null = null
) {
  const supabase = await createClient();
  const household_id = await getCurrentHouseholdId();
  const { data: existing, error: fetchError } = await supabase
    .from("categories")
    .select("color")
    .eq("household_id", household_id);
  if (fetchError) throw new Error(fetchError.message);
  const used = new Set((existing ?? []).map((c) => c.color));
  const color = CATEGORY_COLOR_SLOTS.find((c) => !used.has(c)) ?? CATEGORY_COLOR_SLOTS[0];

  const { data: category, error: catError } = await supabase
    .from("categories")
    .insert({
      household_id,
      name: name.trim(),
      icon,
      color,
      type: "expense",
      default_pocket_id: null,
    })
    .select("id")
    .single();
  if (catError) throw new Error(catError.message);

  if (amount_limit && amount_limit > 0) {
    await upsertBudget({ category_id: category.id, amount_limit, scope, user_id, month });
  }
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function updateCategoryRollover(id: string, budget_rollover: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ budget_rollover }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

/** Flags a category as "savings" (e.g. Livret A payments) so bills in it show up on the Épargne page with their own running total, instead of blending into regular Dépenses fixes. */
export async function updateCategoryIsSavings(id: string, is_savings: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_savings }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export type GoalInput = {
  name: string;
  target_amount: number;
  target_date: string | null;
  pocket_id: string | null;
};

export async function createGoal(input: GoalInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .insert({ ...input, current_amount: 0, household_id: await getCurrentHouseholdId() });
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export async function contributeToGoal(id: string, amount: number) {
  const supabase = await createClient();
  const { data: goal, error: fetchError } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const { error } = await supabase
    .from("goals")
    .update({ current_amount: goal.current_amount + amount })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export type BillInput = {
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  default_payer: string | null;
  pocket_id: string | null;
  autopay: boolean;
  installments_total: number | null;
  final_amount: number | null;
  first_amount: number | null;
  start_date: string | null;
};

export async function createBill(input: BillInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .insert({ ...input, household_id: await getCurrentHouseholdId() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await syncCategoryBudgetFromBills(supabase, input.category_id);
  revalidateMoneyPaths();
  return data.id;
}

export async function updateBill(id: string, input: BillInput) {
  const supabase = await createClient();
  const { data: previous } = await supabase.from("bills").select("category_id").eq("id", id).single();
  const { error } = await supabase.from("bills").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  if (previous && previous.category_id !== input.category_id) {
    await syncCategoryBudgetFromBills(supabase, previous.category_id);
  }
  await syncCategoryBudgetFromBills(supabase, input.category_id);
  revalidateMoneyPaths();
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const { data: bill } = await supabase.from("bills").select("category_id").eq("id", id).single();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (bill) await syncCategoryBudgetFromBills(supabase, bill.category_id);
  revalidateMoneyPaths();
}

export async function markBillPaid(billId: string, userId: string | null) {
  const supabase = await createClient();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select(
      "name, amount, category_id, pocket_id, installments_total, final_amount, first_amount, start_date, category:categories(default_pocket_id)"
    )
    .eq("id", billId)
    .single();
  if (billError) throw new Error(billError.message);

  const category = bill.category as unknown as { default_pocket_id: string | null } | null;
  const pocket_id = bill.pocket_id ?? category?.default_pocket_id ?? null;

  const currentInstallment = bill.start_date ? installmentNumberFor(bill.start_date) : null;
  const isFirstInstallment = !!bill.installments_total && currentInstallment !== null && currentInstallment <= 1;
  const isLastInstallment =
    !!bill.installments_total && currentInstallment !== null && currentInstallment >= bill.installments_total;
  const amount =
    isFirstInstallment && bill.first_amount != null
      ? bill.first_amount
      : isLastInstallment && bill.final_amount != null
        ? bill.final_amount
        : bill.amount;

  const household_id = await getCurrentHouseholdId();

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      amount,
      description: bill.name,
      date: new Date().toISOString().slice(0, 10),
      category_id: bill.category_id,
      paid_by: userId,
      pocket_id,
      split_type: "shared",
      split_ratio: {},
      household_id,
    })
    .select("id")
    .single();
  if (txError) throw new Error(txError.message);

  if (isLastInstallment) {
    await supabase.from("bills").update({ active: false }).eq("id", billId);
  }

  const { error } = await supabase.from("bill_payments").upsert(
    {
      bill_id: billId,
      month: currentMonth(),
      paid_at: new Date().toISOString(),
      paid_by: userId,
      transaction_id: transaction.id,
      household_id,
    },
    { onConflict: "bill_id,month" }
  );
  if (error) throw new Error(error.message);

  revalidateMoneyPaths();
}

export async function markBillUnpaid(billId: string) {
  const supabase = await createClient();

  // Target the most recent payment rather than assuming it's this calendar
  // month — a completed installment bill's final payment may have landed in
  // an earlier month, and it should still be reachable to undo.
  const { data: payment, error: fetchError } = await supabase
    .from("bill_payments")
    .select("id, month, transaction_id")
    .eq("bill_id", billId)
    .not("paid_at", "is", null)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!payment) return;

  if (payment.transaction_id) {
    const { error: deleteTxError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", payment.transaction_id);
    if (deleteTxError) throw new Error(deleteTxError.message);
  }

  const { error } = await supabase.from("bill_payments").delete().eq("id", payment.id);
  if (error) throw new Error(error.message);

  const { data: bill } = await supabase.from("bills").select("installments_total").eq("id", billId).single();
  if (bill?.installments_total) {
    await supabase.from("bills").update({ active: true }).eq("id", billId);
  }

  revalidateMoneyPaths();
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export async function updateHouseholdName(name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom du foyer ne peut pas être vide");
  const household_id = await getCurrentHouseholdId();
  const { error } = await supabase.from("households").update({ name: trimmed }).eq("id", household_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateDisplayName(display_name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const trimmed = display_name.trim();
  if (!trimmed) throw new Error("Le prénom ne peut pas être vide");
  const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Adds a member who has no login of their own (e.g. a spouse who'll join
 * later, or a child who never will). RLS only allows inserting memberless
 * rows into your own household — see 0027_members_without_login.sql.
 */
export async function createMember(display_name: string) {
  const supabase = await createClient();
  const trimmed = display_name.trim();
  if (!trimmed) throw new Error("Le prénom ne peut pas être vide");
  const household_id = await getCurrentHouseholdId();
  const { error } = await supabase
    .from("profiles")
    .insert({ display_name: trimmed, household_id, user_id: null });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Renames a memberless member. RLS enforces this only works for profiles
 * with no linked account — renaming yourself goes through updateDisplayName.
 */
export async function updateMemberName(memberId: string, display_name: string) {
  const supabase = await createClient();
  const trimmed = display_name.trim();
  if (!trimmed) throw new Error("Le prénom ne peut pas être vide");
  const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updatePocketAllocation(id: string, allocation_pct: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("pockets").update({ allocation_pct }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function updatePocketReceivesSurplus(id: string, receives_surplus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("pockets").update({ receives_surplus }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

/**
 * Applies several pockets' allocation/surplus settings in one server action
 * instead of one call per field per pocket — each of those calls revalidates
 * "/settings", and firing that repeatedly while the page issuing them is
 * still on-screen was tearing down the client component mid-loop before it
 * reached the later updates.
 */
export async function applyPocketAllocations(
  updates: { id: string; allocation_pct: number; receives_surplus: boolean }[]
) {
  const supabase = await createClient();
  for (const u of updates) {
    const { error } = await supabase
      .from("pockets")
      .update({ allocation_pct: u.allocation_pct, receives_surplus: u.receives_surplus })
      .eq("id", u.id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function updatePocketOwner(id: string, owner_id: string | null) {
  const supabase = await createClient();
  // Picking a real owner (or "Partagé") always clears any earlier custom
  // label — the two are mutually exclusive ways of answering "for whom".
  const { error } = await supabase
    .from("pockets")
    .update({ owner_id, custom_owner_label: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

/**
 * A pocket can be "for" someone who isn't a registered profile (a child,
 * say) without making them a real owner — functionally it stays
 * owner_id = null (shared, same as "Partagé" for income-split purposes),
 * this only changes what's displayed instead of the generic "Partagé".
 */
export async function updatePocketCustomLabel(id: string, label: string) {
  const supabase = await createClient();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Le nom ne peut pas être vide");
  const { error } = await supabase
    .from("pockets")
    .update({ owner_id: null, custom_owner_label: trimmed })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export type PocketInput = {
  name: string;
  icon: string;
  color: string;
  allocation_pct: number;
  receives_surplus?: boolean;
  owner_id?: string | null;
  custom_owner_label?: string | null;
  is_savings?: boolean;
};

export async function createPocket(input: PocketInput) {
  const supabase = await createClient();
  const { count } = await supabase.from("pockets").select("id", { count: "exact", head: true });
  const { error } = await supabase
    .from("pockets")
    .insert({ ...input, sort_order: count ?? 0, household_id: await getCurrentHouseholdId() });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

export async function deletePocket(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pockets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}

/**
 * Points a transaction (a one-off dépense, or the transaction created when a
 * bill is marked paid) or a bill (its own reference document, e.g. an
 * insurance contract PDF) at a file already uploaded to the private
 * "receipts" storage bucket. The upload itself happens client-side against
 * Supabase Storage directly — this just records the resulting path.
 */
export async function attachReceipt(table: "transactions" | "bills", id: string, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ receipt_url: path }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

export async function removeReceipt(table: "transactions" | "bills", id: string) {
  const supabase = await createClient();
  const { data: row } = await supabase.from(table).select("receipt_url").eq("id", id).single();
  if (row?.receipt_url) {
    await supabase.storage.from("receipts").remove([row.receipt_url]);
  }
  const { error } = await supabase.from(table).update({ receipt_url: null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMoneyPaths();
}

/** The bucket is private, so viewing a receipt needs a short-lived signed URL generated on demand rather than a stored public link. */
export async function getReceiptSignedUrl(path: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
