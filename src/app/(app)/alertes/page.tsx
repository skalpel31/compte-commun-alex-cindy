import Link from "next/link";
import { CircleAlert, Clock, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBills, getPocketBalances } from "@/lib/data";
import { formatAmount, formatDate } from "@/lib/format";

export default async function AlertesPage() {
  const [bills, pockets] = await Promise.all([getBills(), getPocketBalances()]);
  const pending = bills
    .filter((b) => b.status === "overdue" || b.status === "upcoming")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const lowBalances = pockets
    .map((p) => {
      const upcoming = pending
        .filter((b) => b.pocket_id === p.id)
        .reduce((sum, b) => sum + b.amount, 0);
      return { pocket: p, projected: p.balance - upcoming, upcoming };
    })
    .filter((r) => r.upcoming > 0 && r.projected < 500);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          Ce qui mérite votre attention cette semaine.
        </p>
      </div>

      {lowBalances.length > 0 && (
        <Card className="glass border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-warning" />
              Comptes à surveiller
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lowBalances.map(({ pocket, projected }) => (
              <p key={pocket.id} className="text-sm">
                <span className="font-medium">{pocket.name}</span> passera à{" "}
                {formatAmount(projected)} après les prélèvements à venir.
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prélèvements à venir</CardTitle>
          <Link href="/bills" className="text-xs text-muted-foreground hover:underline">
            Gérer les factures
          </Link>
        </CardHeader>
        <CardContent className="divide-y">
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Rien à venir — tout est payé.
            </p>
          ) : (
            pending.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 py-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    bill.status === "overdue" ? "bg-critical/10" : "bg-warning/10"
                  }`}
                >
                  {bill.status === "overdue" ? (
                    <CircleAlert className="size-4 text-critical" />
                  ) : (
                    <Clock className="size-4 text-warning" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">le {formatDate(bill.dueDate)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatAmount(bill.amount)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
