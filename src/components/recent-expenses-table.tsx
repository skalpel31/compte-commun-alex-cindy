import { Check } from "lucide-react";
import { CategoryIcon, categoryBg } from "@/lib/category-style";
import { formatAmount, dayLabel } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function RecentExpensesTable({ transactions }: { transactions: Transaction[] }) {
  const rows = transactions.filter((t) => t.category?.type !== "income").slice(0, 6);

  if (rows.length === 0) {
    return (
      <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Aucune dépense récente.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="whitespace-nowrap pr-3 pb-2 font-medium">Date</th>
            <th className="pr-3 pb-2 font-medium">Catégorie</th>
            <th className="pr-3 pb-2 font-medium">Payé avec</th>
            <th className="pr-3 pb-2 text-right font-medium">Montant</th>
            <th className="pb-2 text-center font-medium">Règle</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((t) => {
            const followsRule =
              !!t.category?.default_pocket_id && t.category.default_pocket_id === t.pocket_id;
            return (
              <tr key={t.id}>
                <td className="whitespace-nowrap py-2 pr-3 text-xs text-muted-foreground">
                  {dayLabel(t.date)}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(t.category?.color ?? null)}`}
                    >
                      <CategoryIcon icon={t.category?.icon ?? null} className="size-3" />
                    </div>
                    <span className="truncate">{t.category?.name ?? "Autre"}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">
                  {t.pocket?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-right font-medium tabular-nums">
                  {formatAmount(t.amount)}
                </td>
                <td className="py-2 text-center">
                  {followsRule && <Check className="mx-auto size-4 text-good" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
