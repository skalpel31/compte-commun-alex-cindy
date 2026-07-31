import { addMonths, endOfMonth, isAfter, startOfMonth } from "date-fns";
import { installmentNumberFor } from "@/lib/bill-installments";
import { localDateString, parisNow } from "@/lib/format";

export type ForecastBill = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  pocketId: string | null; // already resolved: bill.pocket_id ?? category.default_pocket_id
  installments_total: number | null;
  final_amount: number | null;
  first_amount: number | null;
  start_date: string | null;
};

export type BillCoverageEvent = {
  billId: string;
  billName: string;
  pocketId: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
};

export type IncomeForecastEvent = {
  pocketId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  label: string;
};

export type PocketCoverageResult = {
  billId: string;
  covered: boolean;
  shortfall: number; // 0 if covered
  nextIncomeDate: string | null; // first future income landing in that pocket after the bill, if not covered
};

/** Today through the end of next month — covers a recurring income cycle
 * that spans a calendar-month boundary (e.g. paid every 14 days), regardless
 * of where in the current month "today" falls. */
export function defaultForecastHorizon(today = parisNow()): { start: Date; end: Date } {
  return { start: today, end: endOfMonth(addMonths(today, 1)) };
}

/** Distinct "YYYY-MM-01" month strings overlapped by the horizon, matching
 * bill_payments.month's format for the paid-lookup query. */
export function monthsInRange(rangeStart: Date, rangeEnd: Date): string[] {
  const months: string[] = [];
  let cursor = startOfMonth(rangeStart);
  while (!isAfter(cursor, rangeEnd)) {
    months.push(localDateString(cursor).slice(0, 7) + "-01");
    cursor = addMonths(cursor, 1);
  }
  return months;
}

/**
 * Dated bill occurrences over an arbitrary horizon — withBillStatus only
 * ever computes the current month's due date, this generalizes that same
 * installment/amount-override logic (reusing installmentNumberFor's
 * referenceDate param) across however many months the horizon spans, and
 * skips any (billId, month) already recorded paid.
 */
export function billOccurrencesInRange(
  bills: ForecastBill[],
  paidPairs: Set<string>, // `${billId}|${monthDateStr}`
  rangeStart: Date,
  rangeEnd: Date
): BillCoverageEvent[] {
  const startStr = localDateString(rangeStart);
  const endStr = localDateString(rangeEnd);
  const events: BillCoverageEvent[] = [];

  for (const bill of bills) {
    if (!bill.pocketId) continue; // nothing to project into an unresolved account
    let cursor = startOfMonth(rangeStart);
    let guard = 0;
    while (!isAfter(cursor, rangeEnd) && guard < 24) {
      const dueDate = new Date(cursor.getFullYear(), cursor.getMonth(), bill.due_day);
      const dueDateStr = localDateString(dueDate);
      const monthStr = localDateString(cursor).slice(0, 7) + "-01";
      cursor = addMonths(cursor, 1);
      guard++;
      if (dueDateStr < startStr || dueDateStr > endStr) continue;
      if (paidPairs.has(`${bill.id}|${monthStr}`)) continue;

      const currentInstallment = bill.start_date ? installmentNumberFor(bill.start_date, dueDate) : null;
      if (bill.installments_total && currentInstallment !== null && currentInstallment > bill.installments_total) {
        continue;
      }
      const isFirst = !!bill.installments_total && currentInstallment !== null && currentInstallment <= 1;
      const isLast =
        !!bill.installments_total && currentInstallment !== null && currentInstallment >= bill.installments_total;
      const amount =
        isFirst && bill.first_amount != null
          ? bill.first_amount
          : isLast && bill.final_amount != null
            ? bill.final_amount
            : bill.amount;

      events.push({ billId: bill.id, billName: bill.name, pocketId: bill.pocketId, amount, dueDate: dueDateStr });
    }
  }
  return events.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Per-pocket running-balance timeline: starts from today's real balance
 * (computePocketBalances already nets out all history), then walks future
 * events chronologically. On a same-day tie, bills are applied before
 * income — the pessimistic assumption — so a bill only ever reads
 * "covered" when it's genuinely safe under the worst plausible ordering.
 */
export function computeBillCoverage(
  pocketBalances: { id: string; balance: number }[],
  billEvents: BillCoverageEvent[],
  incomeEvents: IncomeForecastEvent[]
): PocketCoverageResult[] {
  const results: PocketCoverageResult[] = [];
  const balanceByPocket = new Map(pocketBalances.map((p) => [p.id, p.balance]));
  const pocketIds = new Set([...billEvents.map((b) => b.pocketId), ...incomeEvents.map((e) => e.pocketId)]);

  for (const pocketId of pocketIds) {
    type Ev =
      | { kind: "bill"; dueDate: string; billId: string; amount: number }
      | { kind: "income"; dueDate: string; amount: number };
    const events: Ev[] = [
      ...billEvents
        .filter((b) => b.pocketId === pocketId)
        .map((b) => ({ kind: "bill" as const, dueDate: b.dueDate, billId: b.billId, amount: b.amount })),
      ...incomeEvents
        .filter((e) => e.pocketId === pocketId)
        .map((e) => ({ kind: "income" as const, dueDate: e.date, amount: e.amount })),
    ].sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.kind === b.kind) return 0;
      return a.kind === "bill" ? -1 : 1;
    });

    let running = balanceByPocket.get(pocketId) ?? 0;
    for (const ev of events) {
      if (ev.kind === "income") {
        running += ev.amount;
        continue;
      }
      running -= ev.amount;
      const covered = running >= 0;
      results.push({
        billId: ev.billId,
        covered,
        shortfall: covered ? 0 : Math.round(-running * 100) / 100,
        nextIncomeDate: covered
          ? null
          : (events.find((e2) => e2.kind === "income" && e2.dueDate > ev.dueDate)?.dueDate ?? null),
      });
    }
  }
  return results;
}
