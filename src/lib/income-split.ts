export type PocketAllocInput = {
  id: string;
  allocation_pct: number;
  owner_id: string | null;
  receives_surplus: boolean;
};

/**
 * A personal pocket only gets funded by its own owner's income — the
 * percentage that would've gone to the other partner's personal pocket is
 * instead split evenly across pockets flagged "receives_surplus" (e.g. kids'
 * livrets). If none are flagged, it falls back to the payer's own personal
 * pocket. Income attributed to Compte Joint itself (no personal payer) skips
 * this redirection entirely. Percentages are normalized against whatever
 * they actually sum to, so the full amount is always allocated even if the
 * pockets' percentages don't add up to exactly 100.
 */
export function computeIncomeSplit(
  pockets: PocketAllocInput[],
  payerId: string | null,
  amount: number
): { pocketId: string; amount: number }[] {
  const applicable = pockets.filter((p) => !p.owner_id || p.owner_id === payerId);
  const otherPersonalPct = payerId
    ? pockets.filter((p) => p.owner_id && p.owner_id !== payerId).reduce((sum, p) => sum + p.allocation_pct, 0)
    : 0;
  const surplusRecipients = payerId ? applicable.filter((p) => p.receives_surplus) : [];
  const surplusSharePct = surplusRecipients.length > 0 ? otherPersonalPct / surplusRecipients.length : 0;

  const weighted = applicable.map((p) => {
    let pct = p.allocation_pct;
    if (payerId && surplusRecipients.length > 0 && p.receives_surplus) {
      pct += surplusSharePct;
    } else if (payerId && surplusRecipients.length === 0 && p.owner_id === payerId) {
      pct += otherPersonalPct;
    }
    return { pocketId: p.id, pct };
  });

  const totalPct = weighted.reduce((sum, w) => sum + w.pct, 0);
  if (totalPct <= 0) return [];

  const rows = weighted.map((w) => ({
    pocketId: w.pocketId,
    amount: Math.round(amount * (w.pct / totalPct) * 100) / 100,
  }));

  const distributed = rows.reduce((sum, r) => sum + r.amount, 0);
  const remainder = Math.round((amount - distributed) * 100) / 100;
  if (remainder !== 0 && rows.length > 0) {
    const largest = rows.reduce((a, b) => (a.amount >= b.amount ? a : b));
    largest.amount = Math.round((largest.amount + remainder) * 100) / 100;
  }

  return rows.filter((row) => row.amount > 0);
}
