import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Receipt } from "lucide-react";
import { TransactionRow } from "@/components/transaction-row";
import { IncomeGroupRow } from "@/components/income-group-row";
import { getCurrentHouseholdId, getProfiles, getTransactions } from "@/lib/data";
import { dayLabel } from "@/lib/format";
import type { Transaction } from "@/lib/types";

/**
 * An income transaction is auto-split into one row per pocket at entry time
 * (see createTransaction); those rows share date/description/category/payer
 * and differ only by pocket_id and amount. Regroup them here so the ledger
 * shows one line per real-world paycheck instead of one per pocket.
 */
function groupIncomeSplits(transactions: Transaction[]): (Transaction | Transaction[])[] {
  const seen = new Set<string>();
  const result: (Transaction | Transaction[])[] = [];
  for (const t of transactions) {
    if (seen.has(t.id)) continue;
    if (t.category?.type !== "income") {
      result.push(t);
      continue;
    }
    const siblings = transactions.filter(
      (o) =>
        o.category?.type === "income" &&
        o.date === t.date &&
        o.description === t.description &&
        o.category_id === t.category_id &&
        o.paid_by === t.paid_by
    );
    siblings.forEach((s) => seen.add(s.id));
    result.push(siblings.length > 1 ? siblings : t);
  }
  return result;
}

export default async function TransactionsPage() {
  const [transactions, profiles, householdId] = await Promise.all([
    getTransactions(),
    getProfiles(),
    getCurrentHouseholdId(),
  ]);

  const groups = new Map<string, (Transaction | Transaction[])[]>();
  for (const item of groupIncomeSplits(transactions)) {
    const date = Array.isArray(item) ? item[0].date : item.date;
    const list = groups.get(date) ?? [];
    list.push(item);
    groups.set(date, list);
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
                {items.map((item) =>
                  Array.isArray(item) ? (
                    <IncomeGroupRow key={item[0].id} transactions={item} profiles={profiles} />
                  ) : (
                    <TransactionRow
                      key={item.id}
                      transaction={item}
                      profiles={profiles}
                      householdId={householdId}
                    />
                  )
                )}
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
