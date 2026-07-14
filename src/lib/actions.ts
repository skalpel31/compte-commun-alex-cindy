"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/format";

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
async function syncCategoryBudgetFromBills(supabase: SupabaseClient, categoryId: string | null) {
  if (!categoryId) return;
  const month = currentMonth();

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
    if (existing?.auto) await supabase.from("budgets").delete().eq("id", existing.id);
    return;
  }

  if (!existing) {
    await supabase
      .from("budgets")
      .insert({ category_id: categoryId, month, amount_limit: total, scope: "shared", user_id: null, auto: true });
  } else if (existing.auto) {
    await supabase.from("budgets").update({ amount_limit: total }).eq("id", existing.id);
  }
}

export type TransactionInput = {
  amount: number;
  description: string;
  date: string;
  category_id: string;
  paid_by: string;
  pocket_id: string | null;
};

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
    const { data: allPockets } = await supabase.from("pockets").select("id, allocation_pct, owner_id");
    const pockets = allPockets ?? [];

    // A personal pocket only gets funded by its own owner's income — the
    // percentage that would've gone to the other partner's personal pocket
    // is redirected to the payer's own personal pocket instead.
    const otherPersonalPct = pockets
      .filter((p) => p.owner_id && p.owner_id !== input.paid_by)
      .reduce((sum, p) => sum + p.allocation_pct, 0);

    const rows = pockets
      .filter((p) => !p.owner_id || p.owner_id === input.paid_by)
      .map((p) => {
        const pct = p.owner_id === input.paid_by ? p.allocation_pct + otherPersonalPct : p.allocation_pct;
        return { ...base, amount: Math.round(input.amount * (pct / 100) * 100) / 100, pocket_id: p.id };
      })
      .filter((row) => row.amount > 0);

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) throw new Error(error.message);
  } else {
    const pocket_id = input.pocket_id ?? category?.default_pocket_id ?? null;
    const { error } = await supabase.from("transactions").insert({ ...base, pocket_id });
    if (error) throw new Error(error.message);
  }

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
      { ...input, month: input.month ?? currentMonth(), auto: false },
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
  const { error } = await supabase.from("categories").upsert(input);
  if (error) throw new Error(error.message);
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

export type GoalInput = {
  name: string;
  target_amount: number;
  target_date: string | null;
  pocket_id: string | null;
};

export async function createGoal(input: GoalInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({ ...input, current_amount: 0 });
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
};

/** Counts completed installments for a bill, across all months. */
async function countPaidInstallments(supabase: SupabaseClient, billId: string) {
  const { count } = await supabase
    .from("bill_payments")
    .select("id", { count: "exact", head: true })
    .eq("bill_id", billId)
    .not("paid_at", "is", null);
  return count ?? 0;
}

export async function createBill(input: BillInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("bills").insert(input);
  if (error) throw new Error(error.message);
  await syncCategoryBudgetFromBills(supabase, input.category_id);
  revalidateMoneyPaths();
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

export async function markBillPaid(billId: string, userId: string) {
  const supabase = await createClient();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select(
      "name, amount, category_id, pocket_id, installments_total, final_amount, category:categories(default_pocket_id)"
    )
    .eq("id", billId)
    .single();
  if (billError) throw new Error(billError.message);

  const category = bill.category as unknown as { default_pocket_id: string | null } | null;
  const pocket_id = bill.pocket_id ?? category?.default_pocket_id ?? null;

  const installmentsPaid = await countPaidInstallments(supabase, billId);
  const isLastInstallment = !!bill.installments_total && installmentsPaid + 1 >= bill.installments_total;
  const amount = isLastInstallment && bill.final_amount != null ? bill.final_amount : bill.amount;

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

export async function updatePocketAllocation(id: string, allocation_pct: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("pockets").update({ allocation_pct }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidateMoneyPaths();
}
