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

export function currentMonth() {
  return localMonthString(new Date()) + "-01";
}

export function dayLabel(value: string) {
  const date = new Date(value + "T00:00:00");
  const today = new Date();
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
