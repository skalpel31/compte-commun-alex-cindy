import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/format";
import type { BillWithStatus } from "@/lib/types";

export function SmartAlertCard({
  headline,
  bills,
}: {
  headline: string | null;
  bills: BillWithStatus[];
}) {
  if (!headline && bills.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-4 text-good" />
            Alerte intelligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            Rien à signaler, tout est sous contrôle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-warning/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TriangleAlert className="size-4 text-warning" />
          Alerte intelligente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {headline && <p className="text-sm font-medium">{headline}</p>}
        <div className="flex flex-col gap-2">
          {bills.map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm">
              <span className="truncate text-muted-foreground">{b.name}</span>
              <span className="shrink-0 font-medium tabular-nums">{formatAmount(b.amount)}</span>
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                le {formatDate(b.dueDate)}
              </span>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          variant="secondary"
          nativeButton={false}
          render={<Link href="/alertes" />}
        >
          Voir le calendrier complet
        </Button>
      </CardContent>
    </Card>
  );
}
