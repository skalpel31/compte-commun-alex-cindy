import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mouvements</h1>
          <p className="text-sm text-muted-foreground">Dépenses et revenus du compte commun.</p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/transactions/new" />}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Aucune transaction pour le moment.
        </CardContent>
      </Card>
    </div>
  );
}
