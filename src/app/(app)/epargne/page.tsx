import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { getGoals, getPocketBalances } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function EpargnePage() {
  const [pockets, goals] = await Promise.all([getPocketBalances(), getGoals()]);
  const savings = pockets.find((p) => p.name.toLowerCase().includes("épargne")) ?? pockets[0];
  const linkedGoals = goals.filter((g) => g.pocket_id === savings?.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Épargne</h1>
        <p className="text-sm text-muted-foreground">
          Ce que vous mettez de côté, et pour quoi.
        </p>
      </div>

      {savings && (
        <Card className="glass">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-full text-white ${categoryBg(savings.color)}`}>
                <CategoryIcon icon={savings.icon} className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{savings.name}</p>
                <p className={`text-2xl font-semibold tabular-nums ${categoryText(savings.color)}`}>
                  {formatAmount(savings.balance)}
                </p>
              </div>
            </div>
            <Sparkline values={savings.sparkline} color={savings.color} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectifs liés à l&apos;épargne</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {linkedGoals.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun objectif lié pour l&apos;instant — crée-en un depuis la page Objectifs.
            </p>
          ) : (
            linkedGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
              return (
                <div key={g.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{g.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatAmount(g.current_amount)} / {formatAmount(g.target_amount)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-5"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
