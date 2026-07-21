"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/admin";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Deletes a login account. Cascades its profile row automatically (see
 * profiles_id_fkey replacement in 0027) — if that profile owned a household
 * alone, the household itself is left behind empty; use adminDeleteHousehold
 * for that. */
export async function adminDeleteUser(authUserId: string) {
  await requireSuperAdmin();
  const admin = adminClient();
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Deletes a household outright — cascades every profile, transaction,
 * pocket, bill, etc. tied to it (see the household_id FKs in
 * 0024_households.sql), but does NOT delete the auth.users login accounts
 * themselves. Meant for cleaning up empty/test households. */
export async function adminDeleteHousehold(householdId: string) {
  await requireSuperAdmin();
  const admin = adminClient();
  const { error } = await admin.from("households").delete().eq("id", householdId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
