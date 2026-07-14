import { createClient } from "@/lib/supabase/server";
import { currentMonth, localDateString, localMonthString } from "@/lib/format";
import { installmentNumberFor } from "@/lib/bill-installments";
import type {
  Bill,
  BillWithStatus,
  Budget,
  Category,
  Goal,
  Pocket,
  Profile,
  Transaction,
} from "@/lib/types";

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return data ?? [];
}

export async function getPockets(): Promise<Pocket[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pockets").select("*").order("sort_order");
  return data ?? [];
}

export type PocketBalance = Pocket & { balance: number; sparkline: number[] };

export async function getPocketBalances(): Promise<PocketBalance[]> {
  const supabase = await createClient();
  const [{ data: pockets }, { data: rows }] = await Promise.all([
    supabase.from("pockets").select("*").order("sort_order"),
    supabase
      .from("transactions")
      .select("amount, date, pocket_id, category:categories(type)")
      .order("date"),
  ]);

  type Row = {
    amount: number;
    date: string;
    pocket_id: string | null;
    category: { type: string } | null;
  };
  const txs = (rows as Row[] | null) ?? [];

  const days = 14;
  const today = new Date();
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayKeys.push(localDateString(d));
  }

  return ((pockets as Pocket[] | null) ?? []).map((p) => {
    const pocketTxs = txs.filter((t) => t.pocket_id === p.id);
    const signed = (t: Row) => (t.category?.type === "income" ? 1 : -1) * t.amount;
    const balance = pocketTxs.reduce((sum, t) => sum + signed(t), 0);

    const before = pocketTxs
      .filter((t) => t.date < dayKeys[0])
      .reduce((sum, t) => sum + signed(t), 0);
    const sparkline: number[] = [];
    let running = before;
    for (const key of dayKeys) {
      running += pocketTxs.filter((t) => t.date === key).reduce((sum, t) => sum + signed(t), 0);
      sparkline.push(running);
    }

    return { ...p, balance, sparkline };
  });
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
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

async function withBillStatus(
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
    const isLastInstallment = !!bill.installments_total && currentInstallment >= bill.installments_total;
    const effectiveAmount = isLastInstallment && bill.final_amount != null ? bill.final_amount : bill.amount;

    return { ...bill, status, dueDate, autoMarked: !!payment?.auto, installmentsPaid, isLastInstallment, effectiveAmount };
  });
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

export type IncomeSource = { label: string; amount: number };

export async function getMonthIncome(
  month = currentMonth()
): Promise<{ sources: IncomeSource[]; total: number; byPocket: Record<string, number> }> {
  const transactions = await getMonthTransactions(month);
  const income = transactions.filter((t) => t.category?.type === "income");
  const total = income.reduce((sum, t) => sum + t.amount, 0);

  const byLabel = new Map<string, number>();
  const byPocket: Record<string, number> = {};
  for (const t of income) {
    const label = t.description || t.category?.name || "Revenu";
    byLabel.set(label, (byLabel.get(label) ?? 0) + t.amount);
    if (t.pocket_id) byPocket[t.pocket_id] = (byPocket[t.pocket_id] ?? 0) + t.amount;
  }

  return {
    sources: Array.from(byLabel, ([label, amount]) => ({ label, amount })),
    total,
    byPocket,
  };
}

