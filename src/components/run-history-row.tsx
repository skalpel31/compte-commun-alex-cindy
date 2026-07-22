import Link from "next/link";
import { ChevronRight, Footprints } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatDistance, formatDuration, formatPace } from "@/lib/geo";
import type { Run } from "@/lib/types";

export function RunHistoryRow({ run }: { run: Run }) {
  const pace = formatPace(run.distance_m, run.duration_s);
  return (
    <Link
      href={`/course-a-pied/${run.id}`}
      className="flex items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Footprints className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {formatDistance(run.distance_m)} · {formatDuration(run.duration_s)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(run.started_at)} · {run.profile?.display_name}
          {pace && ` · ${pace}`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
