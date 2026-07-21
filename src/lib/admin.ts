import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { withBillStatus, computePocketBalances, type PocketBalanceTxRow } from "@/lib/data";
import type { Pocket, Goal, Transaction, BillWithStatus, Bill } from "@/lib/types";

/**
 * Service-role client for the /admin panel only — bypasses RLS entirely, so
 * every query in this file must explicitly filter by household_id itself
 * (unlike src/lib/data.ts, which relies on RLS to auto-scope reads).
 */
function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user?.email && user.email === process.env.SUPER_ADMIN_EMAIL;
}

export async function requireSuperAdmin() {
  if (!(await isSuperAdmin())) throw new Error("Accès réservé au super admin");
}

export type AdminMember = {
  id: string;
  display_name: string;
  user_id: string | null;
  email: string | null;
  claim_code: string | null;
};

export type AdminHousehold = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  members: AdminMember[];
};

export async function getAllHouseholdsOverview(): Promise<AdminHousehold[]> {
  await requireSuperAdmin();
  const admin = adminClient();

  const [{ data: households }, { data: profiles }, { data: authList }] = await Promise.all([
    admin.from("households").select("id, name, invite_code, created_at").order("created_at"),
    admin.from("profiles").select("id, display_name, user_id, claim_code, household_id"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailByUserId = new Map(authList?.users.map((u) => [u.id, u.email ?? null]));

  return (households ?? []).map((h) => ({
    ...h,
    members: (profiles ?? [])
      .filter((p) => p.household_id === h.id)
      .map((p) => ({
        id: p.id,
        display_name: p.display_name,
        user_id: p.user_id,
        claim_code: p.claim_code,
        email: p.user_id ? (emailByUserId.get(p.user_id) ?? null) : null,
      })),
  }));
}

export type AdminHouseholdPreview = {
  household: { id: string; name: string };
  members: AdminMember[];
  pockets: (Pocket & { balance: number; sparkline: number[] })[];
  bills: BillWithStatus[];
  goals: Goal[];
  recentTransactions: Transaction[];
};

export async function getHouseholdPreview(householdId: string): Promise<AdminHouseholdPreview> {
  await requireSuperAdmin();
  const admin = adminClient();

  const [
    { data: household },
    { data: profiles },
    { data: pockets },
    { data: pocketTxRows },
    { data: bills },
    { data: goals },
    { data: recentTransactions },
    { data: authList },
  ] = await Promise.all([
    admin.from("households").select("id, name").eq("id", householdId).single(),
    admin.from("profiles").select("id, display_name, user_id, claim_code, household_id").eq("household_id", householdId),
    admin.from("pockets").select("*").eq("household_id", householdId).order("sort_order"),
    admin
      .from("transactions")
      .select("amount, date, pocket_id, category:categories(type)")
      .eq("household_id", householdId)
      .order("date"),
    admin
      .from("bills")
      .select("*, category:categories(*)")
      .eq("household_id", householdId)
      .eq("active", true)
      .order("due_day"),
    admin.from("goals").select("*").eq("household_id", householdId).order("created_at"),
    admin
      .from("transactions")
      .select("*, category:categories(*), pocket:pockets(*)")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailByUserId = new Map(authList?.users.map((u) => [u.id, u.email ?? null]));
  const members: AdminMember[] = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    user_id: p.user_id,
    claim_code: p.claim_code,
    email: p.user_id ? (emailByUserId.get(p.user_id) ?? null) : null,
  }));

  const balances = computePocketBalances(
    (pockets as Pocket[] | null) ?? [],
    (pocketTxRows as PocketBalanceTxRow[] | null) ?? []
  );
  const billsWithStatus = await withBillStatus(admin as unknown as Awaited<ReturnType<typeof createClient>>, (bills as Bill[] | null) ?? []);

  return {
    household: { id: household?.id ?? householdId, name: household?.name ?? "Foyer" },
    members,
    pockets: balances,
    bills: billsWithStatus,
    goals: (goals as Goal[] | null) ?? [],
    recentTransactions: (recentTransactions as Transaction[] | null) ?? [],
  };
}
