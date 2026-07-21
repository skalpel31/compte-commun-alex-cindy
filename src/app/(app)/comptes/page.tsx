import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PocketCards } from "@/components/pocket-cards";
import { PocketManager } from "@/components/pocket-manager";
import { getPockets, getPocketBalances } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function ComptesPage() {
  const [balances, pockets] = await Promise.all([getPocketBalances(), getPockets()]);
  const total = balances.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comptes</h1>
        <p className="text-sm text-muted-foreground">
          Solde total{" "}
          <span className="font-medium text-foreground">{formatAmount(total)}</span>
        </p>
      </div>

      <PocketCards pockets={balances} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter ou modifier un compte</CardTitle>
        </CardHeader>
        <CardContent>
          <PocketManager pockets={pockets} />
        </CardContent>
      </Card>
    </div>
  );
}
