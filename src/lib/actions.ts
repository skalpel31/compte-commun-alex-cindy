"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/format";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
  split_type: "shared" | "personal";
  split_ratio: Record<string, number>;
};

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settle");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settle");
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
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budgets");
}

export async function createSettlement(input: {
  from_user: string;
  to_user: string;
  amount: number;
  note?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("settlements").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/settle");
  revalidatePath("/dashboard");
}

export type CategoryInput = {
  id?: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
};

export async function upsertCategory(input: CategoryInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").upsert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export type GoalInput = {
  name: string;
  target_amount: number;
  target_date: string | null;
};

export async function createGoal(input: GoalInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({ ...input, current_amount: 0 });
  if (error) throw new Error(error.message);
  revalidatePath("/budgets");
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
  revalidatePath("/budgets");
}

export type BillInput = {
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  default_payer: string | null;
  autopay: boolean;
};

export async function createBill(input: BillInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("bills").insert(input);
  if (error) throw new Error(error.message);
  await syncCategoryBudgetFromBills(supabase, input.category_id);
  revalidatePath("/bills");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
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
  revalidatePath("/bills");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const { data: bill } = await supabase.from("bills").select("category_id").eq("id", id).single();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (bill) await syncCategoryBudgetFromBills(supabase, bill.category_id);
  revalidatePath("/bills");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function markBillPaid(billId: string, userId: string) {
  const supabase = await createClient();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("name, amount, category_id")
    .eq("id", billId)
    .single();
  if (billError) throw new Error(billError.message);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .neq("id", userId);
  if (profilesError) throw new Error(profilesError.message);
  const other = profiles?.[0];

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      amount: bill.amount,
      description: bill.name,
      date: new Date().toISOString().slice(0, 10),
      category_id: bill.category_id,
      paid_by: userId,
      split_type: "shared",
      split_ratio: other ? { [userId]: 50, [other.id]: 50 } : { [userId]: 100 },
    })
    .select("id")
    .single();
  if (txError) throw new Error(txError.message);

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

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settle");
}

export async function markBillUnpaid(billId: string) {
  const supabase = await createClient();

  const { data: payment, error: fetchError } = await supabase
    .from("bill_payments")
    .select("transaction_id")
    .eq("bill_id", billId)
    .eq("month", currentMonth())
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  if (payment?.transaction_id) {
    const { error: deleteTxError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", payment.transaction_id);
    if (deleteTxError) throw new Error(deleteTxError.message);
  }

  const { error } = await supabase
    .from("bill_payments")
    .delete()
    .eq("bill_id", billId)
    .eq("month", currentMonth());
  if (error) throw new Error(error.message);

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settle");
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budgets");
}
