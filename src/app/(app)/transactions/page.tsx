import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Receipt } from "lucide-react";
import { TransactionRow } from "@/components/transaction-row";
import { getProfiles, getTransactions } from "@/lib/data";
import { dayLabel } from "@/lib/format";

export default async function TransactionsPage() {
  const [transactions, profiles] = await Promise.all([getTransactions(), getProfiles()]);

  const groups = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const list = groups.get(t.date) ?? [];
    list.push(t);
    groups.set(t.date, list);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mouvements</h1>
          <p className="text-sm text-muted-foreground">Dépenses et revenus du compte commun.</p>
        </div>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/transactions/new" />}
          className="hidden md:inline-flex"
        >
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {groups.size === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <Receipt className="size-8 text-muted-foreground/40" />
            Aucune transaction pour le moment.
          </CardContent>
        </Card>
      ) : (
        Array.from(groups.entries()).map(([date, items]) => (
          <div key={date}>
            <p className="mb-1 px-1 text-xs font-medium capitalize text-muted-foreground">
              {dayLabel(date)}
            </p>
            <Card>
              <CardContent className="divide-y">
                {items.map((t) => (
                  <TransactionRow key={t.id} transaction={t} profiles={profiles} />
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <Link
        href="/transactions/new"
        aria-label="Ajouter une transaction"
        className="fixed right-4 bottom-20 z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
