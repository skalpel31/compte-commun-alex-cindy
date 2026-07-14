import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillRow } from "@/components/bill-row";
import { NewBillSheet } from "@/components/bill-sheet";
import { getBills, getCategories, getCompletedBills, getPockets, getProfiles } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function BillsPage() {
  const [bills, completedBills, categories, profiles, pockets] = await Promise.all([
    getBills(),
    getCompletedBills(),
    getCategories(),
    getProfiles(),
    getPockets(),
  ]);
  const totalDue = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.effectiveAmount, 0);
  const overdueCount = bills.filter((b) => b.status === "overdue").length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Vos charges récurrentes, avec rappel avant échéance.
          </p>
        </div>
        <NewBillSheet categories={categories} profiles={profiles} pockets={pockets} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Restant à payer ce mois-ci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatAmount(totalDue)}</p>
          {overdueCount > 0 && (
            <p className="text-xs text-critical">
              {overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y">
          {bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune facture — ajoute le loyer, l&apos;électricité, internet...
            </p>
          ) : (
            bills.map((b) => (
              <BillRow key={b.id} bill={b} profiles={profiles} categories={categories} pockets={pockets} />
            ))
          )}
        </CardContent>
      </Card>

      {completedBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Terminées</CardTitle>
          </CardHeader>
          <CardContent className="divide-y opacity-70">
            {completedBills.map((b) => (
              <BillRow key={b.id} bill={b} profiles={profiles} categories={categories} pockets={pockets} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
