import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillRow } from "@/components/bill-row";
import { NewBillSheet } from "@/components/bill-sheet";
import { ResyncBillsButton } from "@/components/resync-bills-button";
import {
  getBills,
  getBudgets,
  getCategories,
  getCompletedBills,
  getCurrentHouseholdId,
  getPockets,
  getProfiles,
} from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function BillsPage() {
  const [bills, completedBills, categories, profiles, pockets, householdId, budgets] = await Promise.all([
    getBills(),
    getCompletedBills(),
    getCategories(),
    getProfiles(),
    getPockets(),
    getCurrentHouseholdId(),
    getBudgets(),
  ]);
  const totalDue = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.effectiveAmount, 0);
  const overdueCount = bills.filter((b) => b.status === "overdue").length;
  const totalFixedCharges = bills.reduce((s, b) => s + b.effectiveAmount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            Vos charges récurrentes, avec rappel avant échéance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ResyncBillsButton />
          <NewBillSheet categories={categories} profiles={profiles} pockets={pockets} budgets={budgets} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Charges fixes du foyer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatAmount(totalFixedCharges)}</p>
            <p className="text-xs text-muted-foreground">par mois, tant qu&apos;une facture est active</p>
          </CardContent>
        </Card>

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
      </div>

      <Card>
        <CardContent className="divide-y">
          {bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune facture — ajoute le loyer, l&apos;électricité, internet...
            </p>
          ) : (
            bills.map((b) => (
              <BillRow key={b.id} bill={b} profiles={profiles} categories={categories} pockets={pockets} budgets={budgets} householdId={householdId} />
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
              <BillRow key={b.id} bill={b} profiles={profiles} categories={categories} pockets={pockets} budgets={budgets} householdId={householdId} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
