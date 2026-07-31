const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatAmount(value: number) {
  return currencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD in local time — never toISOString(), which shifts by the UTC offset. */
export function localDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM in local time. */
export function localMonthString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * "Right now", pinned to Europe/Paris regardless of which timezone the
 * runtime itself is in. Server code runs on Vercel (UTC), while local dev
 * runs in whatever timezone the machine is set to — without this, "today"
 * or "this month" could disagree by up to a few hours right around midnight
 * (e.g. the month rolling over on one but not the other). Reads Paris's
 * current Y/M/D/H/M/S and rebuilds them as a local Date, so any later call
 * to .getFullYear()/.getMonth()/.getDate() in this same process yields
 * Paris's calendar values no matter the process's own timezone.
 */
export function parisNow(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // Midnight is formatted as "24" by this API — normalize back to 0.
  const hour = get("hour") % 24;
  return new Date(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
}

export function currentMonth() {
  return localMonthString(parisNow()) + "-01";
}

/** "YYYY-MM-DD" -> "YYYY-MM-01", the month-bucket format used by budgets/income. */
export function monthOfDate(dateStr: string) {
  return dateStr.slice(0, 7) + "-01";
}

export function dayLabel(value: string) {
  const date = new Date(value + "T00:00:00");
  const today = parisNow();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
    date
  );
}

export function monthLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

/** Shifts a "YYYY-MM-01" month string by `delta` months (negative goes back). */
export function shiftMonth(month: string, delta: number) {
  const [year, monthNum] = month.split("-").map(Number);
  const d = new Date(year, monthNum - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}
