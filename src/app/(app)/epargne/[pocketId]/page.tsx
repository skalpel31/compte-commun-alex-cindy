import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { getPocketBalances, getPocketContributions, getProfiles } from "@/lib/data";
import { formatAmount, formatDate } from "@/lib/format";
import { payerLabel } from "@/lib/payer";

export default async function SavingsPocketPage({
  params,
}: {
  params: Promise<{ pocketId: string }>;
}) {
  const { pocketId } = await params;
  const [pockets, contributions, profiles] = await Promise.all([
    getPocketBalances(),
    getPocketContributions(pocketId),
    getProfiles(),
  ]);
  const pocket = pockets.find((p) => p.id === pocketId && p.is_savings);
  if (!pocket) notFound();

  const total = contributions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/epargne" className="flex w-fit items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Retour
      </Link>

      <Card className="glass">
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-full text-white ${categoryBg(pocket.color)}`}
            >
              <CategoryIcon icon={pocket.icon} className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{pocket.name}</p>
              <p className={`text-2xl font-semibold tabular-nums ${categoryText(pocket.color)}`}>
                {formatAmount(pocket.balance)}
              </p>
            </div>
          </div>
          <Sparkline values={pocket.sparkline} color={pocket.color} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Versements effectués</CardTitle>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            Total : {formatAmount(total)}
          </span>
        </CardHeader>
        <CardContent className="divide-y">
          {contributions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun versement enregistré sur ce compte pour l&apos;instant.
            </p>
          ) : (
            contributions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.description || "Versement"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(t.date)} · {payerLabel(t.paid_by, profiles)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-good tabular-nums">
                  +{formatAmount(t.amount)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
