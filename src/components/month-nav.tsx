import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";

export function MonthNav({ month, basePath }: { month: string; basePath: string }) {
  const isCurrent = month === currentMonth();
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={`${basePath}?month=${prev}`}
        aria-label="Mois précédent"
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-32 text-center text-sm font-medium capitalize">
        {monthLabel(month)}
        {isCurrent && <span className="ml-1 text-xs font-normal text-muted-foreground">(en cours)</span>}
      </span>
      <Link
        href={`${basePath}?month=${next}`}
        aria-label="Mois suivant"
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <ChevronRight className="size-4" />
      </Link>
      {!isCurrent && (
        <Link href={basePath} className="text-xs text-primary hover:underline">
          Revenir à ce mois-ci
        </Link>
      )}
    </div>
  );
}
