import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSavingsBillPayments } from "@/lib/data";
import { formatAmount, monthLabel } from "@/lib/format";

export default async function SavingsBillPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const supabase = await createClient();
  const [{ data: bill }, payments] = await Promise.all([
    supabase
      .from("bills")
      .select("id, name, amount, category:categories(is_savings)")
      .eq("id", billId)
      .single(),
    getSavingsBillPayments(billId),
  ]);

  const isSavingsBill = (bill?.category as unknown as { is_savings: boolean } | null)?.is_savings;
  if (!bill || !isSavingsBill) notFound();

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/epargne" className="flex w-fit items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Retour
      </Link>

      <Card className="glass">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PiggyBank className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{bill.name}</p>
            <p className="text-2xl font-semibold tabular-nums">{formatAmount(total)}</p>
            <p className="text-xs text-muted-foreground">
              {formatAmount(bill.amount)}/mois · versé à ce jour
            </p>
          </div>
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
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun versement enregistré pour l&apos;instant.
            </p>
          ) : (
            payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <p className="text-sm font-medium capitalize">{monthLabel(p.month)}</p>
                <p className="shrink-0 text-sm font-semibold text-good tabular-nums">
                  +{formatAmount(p.amount)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
