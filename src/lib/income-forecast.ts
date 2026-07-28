import { addDays, addMonths, differenceInCalendarDays, isAfter, isBefore } from "date-fns";

export type IncomeScheduleLike = {
  interval_type: "days" | "months";
  interval_value: number;
  anchor_date: string; // YYYY-MM-DD
};

function parseLocalDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

/**
 * First occurrence on or after `from`, stepped in whole intervals from the
 * anchor. For 'months', addMonths naturally reproduces "same day each
 * month, clamped in shorter months" — which is exactly how a real payroll
 * date drifts a few days month to month, so no separate slack field is
 * needed: the user just edits anchor_date if it drifts too far.
 */
export function nextOccurrenceOnOrAfter(schedule: IncomeScheduleLike, from: Date): Date {
  const anchor = parseLocalDate(schedule.anchor_date);
  if (!isAfter(from, anchor)) return anchor;

  if (schedule.interval_type === "days") {
    const diffDays = differenceInCalendarDays(from, anchor);
    const cycles = Math.ceil(diffDays / schedule.interval_value);
    return addDays(anchor, cycles * schedule.interval_value);
  }

  const roughMonths =
    (from.getFullYear() - anchor.getFullYear()) * 12 + (from.getMonth() - anchor.getMonth());
  let cycles = Math.max(0, Math.floor(roughMonths / schedule.interval_value));
  let candidate = addMonths(anchor, cycles * schedule.interval_value);
  while (isBefore(candidate, from)) {
    cycles += 1;
    candidate = addMonths(anchor, cycles * schedule.interval_value);
  }
  return candidate;
}

/** Every occurrence within [rangeStart, rangeEnd], inclusive. */
export function occurrencesInRange(schedule: IncomeScheduleLike, rangeStart: Date, rangeEnd: Date): Date[] {
  const result: Date[] = [];
  let current = nextOccurrenceOnOrAfter(schedule, rangeStart);
  let guard = 0;
  while (!isAfter(current, rangeEnd) && guard < 500) {
    result.push(current);
    current =
      schedule.interval_type === "days"
        ? addDays(current, schedule.interval_value)
        : addMonths(current, schedule.interval_value);
    guard++;
  }
  return result;
}
