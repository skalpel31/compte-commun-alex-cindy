import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { IncomeSource } from "@/lib/data";
import type { Pocket } from "@/lib/types";

export function MoneyFlowCard({
  incomeSources,
  incomeTotal,
  pockets,
}: {
  incomeSources: IncomeSource[];
  incomeTotal: number;
  pockets: Pocket[];
}) {
  return (
    <Card className="glass">
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Revenus du mois</p>
          <p className="text-2xl font-semibold tabular-nums">{formatAmount(incomeTotal)}</p>
          {incomeSources.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Ajoute un revenu (catégorie « Salaire ») pour voir la répartition.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {incomeSources.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{s.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatAmount(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative mx-auto flex size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#4f8cff] p-1 md:size-32">
          <div className="flex size-full flex-col items-center justify-center gap-0.5 rounded-full bg-background px-2 text-center">
            <span className="text-[0.65rem] text-muted-foreground">Argent du foyer</span>
            <span className="text-base font-semibold tabular-nums">{formatAmount(incomeTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Répartition automatique</p>
          {pockets.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
                <CategoryIcon icon={p.icon} className="size-3" />
              </div>
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatAmount(incomeTotal * (p.allocation_pct / 100))}
              </span>
              <span className={`w-9 shrink-0 text-right text-xs ${categoryText(p.color)}`}>
                {p.allocation_pct}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
