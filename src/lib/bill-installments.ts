/**
 * Which installment cycle is due, counting whole calendar months since the
 * first payment (the month of start_date itself is installment 1). Lets a
 * credit or 4x-sans-frais be added retroactively — the count reflects reality
 * even if past cycles were never marked paid inside the app.
 */
export function installmentNumberFor(startDate: string, referenceDate = new Date()): number {
  const start = new Date(startDate + "T00:00:00");
  const months =
    (referenceDate.getFullYear() - start.getFullYear()) * 12 +
    (referenceDate.getMonth() - start.getMonth());
  return Math.max(1, months + 1);
}
