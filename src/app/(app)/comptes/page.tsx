import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PocketCards } from "@/components/pocket-cards";
import { getPocketBalances } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function ComptesPage() {
  const pockets = await getPocketBalances();
  const total = pockets.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comptes</h1>
          <p className="text-sm text-muted-foreground">
            Solde total{" "}
            <span className="font-medium text-foreground">{formatAmount(total)}</span>
          </p>
        </div>
        <Link href="/settings" className="text-xs text-muted-foreground hover:underline">
          Modifier la répartition des revenus
        </Link>
      </div>

      <PocketCards pockets={pockets} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par compte</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {pockets.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 text-sm">
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground">
                {p.allocation_pct}% des revenus
              </span>
              <span className="font-medium tabular-nums">{formatAmount(p.balance)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
