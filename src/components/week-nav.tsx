import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekStart, shiftWeek } from "@/lib/nutrition";
import { formatDate } from "@/lib/format";

export function WeekNav({ weekStart, basePath }: { weekStart: string; basePath: string }) {
  const isCurrent = weekStart === getWeekStart();
  const prev = shiftWeek(weekStart, -1);
  const next = shiftWeek(weekStart, 1);

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={`${basePath}?week=${prev}`}
        aria-label="Semaine précédente"
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-40 text-center text-sm font-medium">
        Semaine du {formatDate(weekStart)}
        {isCurrent && <span className="ml-1 text-xs font-normal text-muted-foreground">(en cours)</span>}
      </span>
      <Link
        href={`${basePath}?week=${next}`}
        aria-label="Semaine suivante"
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <ChevronRight className="size-4" />
      </Link>
      {!isCurrent && (
        <Link href={basePath} className="text-xs text-primary hover:underline">
          Cette semaine
        </Link>
      )}
    </div>
  );
}
