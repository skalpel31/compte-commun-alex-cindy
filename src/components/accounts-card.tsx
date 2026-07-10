import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PocketCards } from "@/components/pocket-cards";
import { formatAmount } from "@/lib/format";
import type { PocketBalance } from "@/lib/data";

export function AccountsCard({ pockets }: { pockets: PocketBalance[] }) {
  const total = pockets.reduce((sum, p) => sum + p.balance, 0);

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Vos comptes</CardTitle>
        <span className="text-xs text-muted-foreground">
          Solde total <span className="font-semibold text-foreground">{formatAmount(total)}</span>
        </span>
      </CardHeader>
      <CardContent>
        <PocketCards pockets={pockets} compact />
      </CardContent>
    </Card>
  );
}
