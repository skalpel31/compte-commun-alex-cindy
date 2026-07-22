import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunMap } from "@/components/run-map";
import { getRun } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatDistance, formatDuration, formatPace } from "@/lib/geo";

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) notFound();

  const pace = formatPace(run.distance_m, run.duration_s);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{run.profile?.display_name}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(run.started_at)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcours</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="text-lg font-semibold tabular-nums">{formatDuration(run.duration_s)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-semibold tabular-nums">{formatDistance(run.distance_m)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Allure</p>
              <p className="text-lg font-semibold tabular-nums">{pace ?? "—"}</p>
            </div>
          </div>
          <RunMap points={run.route} />
        </CardContent>
      </Card>
    </div>
  );
}
