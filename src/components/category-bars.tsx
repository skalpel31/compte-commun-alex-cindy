import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function CategoryBars({ transactions }: { transactions: Transaction[] }) {
  const totals = new Map<string, { name: string; icon: string | null; color: string | null; total: number }>();

  for (const t of transactions) {
    if (!t.category || t.category.type !== "expense") continue;
    const entry = totals.get(t.category.id) ?? {
      name: t.category.name,
      icon: t.category.icon,
      color: t.category.color,
      total: 0,
    };
    entry.total += t.amount;
    totals.set(t.category.id, entry);
  }

  const rows = Array.from(totals.values()).sort((a, b) => b.total - a.total);

  if (rows.length === 0) {
    return (
      <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Pas encore de dépenses ce mois-ci.
      </p>
    );
  }

  const max = rows[0].total;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const pct = Math.max(4, Math.round((row.total / max) * 100));
        return (
          <div key={row.name} className="flex items-center gap-3">
            <CategoryIcon icon={row.icon} className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{row.name}</span>
                <span className="shrink-0 text-muted-foreground">{formatAmount(row.total)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${categoryBg(row.color)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
