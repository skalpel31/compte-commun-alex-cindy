import { IncomeSimulator } from "@/components/income-simulator";
import { getMonthIncome, getPocketBalances } from "@/lib/data";

export default async function SimulationsPage() {
  const [pockets, { total }] = await Promise.all([getPocketBalances(), getMonthIncome()]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Simulations</h1>
        <p className="text-sm text-muted-foreground">
          Testez l&apos;impact d&apos;un changement de revenu sur vos comptes.
        </p>
      </div>

      <IncomeSimulator pockets={pockets} currentIncome={total} />
    </div>
  );
}
