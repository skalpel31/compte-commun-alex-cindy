/** Sentinel for bills.default_payer meaning "always Compte Joint, never ask" — distinct from null, which means "ask each time". */
export const JOINT_PAYER = "joint";

export function payerLabel(
  payerId: string | null,
  profiles: { id: string; display_name: string }[]
): string {
  if (!payerId || payerId === JOINT_PAYER) return "Compte Joint";
  return profiles.find((p) => p.id === payerId)?.display_name ?? "Compte Joint";
}
