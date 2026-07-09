import { createClient } from "@/lib/supabase/server";
import { currentMonth, localDateString, localMonthString } from "@/lib/format";
import type {
  Bill,
  BillWithStatus,
  Budget,
  Category,
  Goal,
  Profile,
  Settlement,
  Transaction,
} from "@/lib/types";

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return data ?? [];
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
    .select("*, category:categories(*)")
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
    .select("*, category:categories(*)")
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

export async function getSettlements(): Promise<Settlement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
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

export async function getBills(): Promise<BillWithStatus[]> {
  const supabase = await createClient();
  const month = currentMonth();
  const [{ data: bills }, { data: payments }] = await Promise.all([
    supabase.from("bills").select("*, category:categories(*)").eq("active", true).order("due_day"),
    supabase.from("bill_payments").select("bill_id, paid_at").eq("month", month),
  ]);

  const today = new Date();
  const todayStr = localDateString(today);
  const paidIds = new Set(
    (payments ?? []).filter((p) => p.paid_at).map((p) => p.bill_id as string)
  );

  return ((bills as Bill[] | null) ?? []).map((bill) => {
    const dueDate = `${month.slice(0, 7)}-${String(bill.due_day).padStart(2, "0")}`;
    let status: BillWithStatus["status"];
    if (paidIds.has(bill.id)) status = "paid";
    else if (dueDate < todayStr) status = "overdue";
    else {
      const diffDays = Math.round(
        (new Date(dueDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) /
          86_400_000
      );
      status = diffDays <= 5 ? "upcoming" : "later";
    }
    return { ...bill, status, dueDate };
  });
}

export type Contribution = {
  profile: Profile;
  target: number;
  paid: number;
};

export async function getContributions(
  month = currentMonth()
): Promise<{ contributions: Contribution[]; totalShared: number }> {
  const [profiles, transactions] = await Promise.all([getProfiles(), getMonthTransactions(month)]);
  const shared = transactions.filter((t) => t.split_type === "shared");
  const totalShared = shared.reduce((sum, t) => sum + t.amount, 0);
  const fallbackShare = profiles.length ? 100 / profiles.length : 0;

  const contributions = profiles.map((profile) => {
    let target = 0;
    let paid = 0;
    for (const t of shared) {
      const share = t.split_ratio?.[profile.id] ?? fallbackShare;
      target += t.amount * (share / 100);
      if (t.paid_by === profile.id) paid += t.amount;
    }
    return { profile, target, paid };
  });

  return { contributions, totalShared };
}

export type Balance = {
  net: number; // positive: profiles[1] owes profiles[0]; negative: profiles[0] owes profiles[1]
  profiles: Profile[];
};

export async function getBalance(): Promise<Balance> {
  const [profiles, transactions, settlements] = await Promise.all([
    getProfiles(),
    getTransactions(),
    getSettlements(),
  ]);

  if (profiles.length < 2) return { net: 0, profiles };
  const [a, b] = profiles;
  let net = 0;

  for (const t of transactions) {
    if (t.split_type !== "shared") continue;
    const payerShare = t.split_ratio?.[t.paid_by] ?? 50;
    const otherShare = t.amount * ((100 - payerShare) / 100);
    if (t.paid_by === a.id) net += otherShare;
    else if (t.paid_by === b.id) net -= otherShare;
  }

  for (const s of settlements) {
    if (s.from_user === b.id && s.to_user === a.id) net -= s.amount;
    else if (s.from_user === a.id && s.to_user === b.id) net += s.amount;
  }

  return { net, profiles };
}
