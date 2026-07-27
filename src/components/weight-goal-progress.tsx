import { TrendingDown, TrendingUp } from "lucide-react";

export function WeightGoalProgress({
  currentWeight,
  previousWeight,
  firstWeight,
  targetWeight,
}: {
  currentWeight: number;
  previousWeight: number | null;
  firstWeight: number;
  targetWeight: number | null;
}) {
  const delta = previousWeight !== null ? currentWeight - previousWeight : null;

  let progressPct: number | null = null;
  let remaining: number | null = null;
  let reached = false;
  if (targetWeight !== null && Math.abs(firstWeight - targetWeight) > 0.01) {
    const losing = targetWeight < firstWeight;
    const total = Math.abs(firstWeight - targetWeight);
    const done = losing ? firstWeight - currentWeight : currentWeight - firstWeight;
    progressPct = Math.min(100, Math.max(0, (done / total) * 100));
    remaining = Math.abs(currentWeight - targetWeight);
    reached = losing ? currentWeight <= targetWeight : currentWeight >= targetWeight;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-semibold tabular-nums">{currentWeight}</p>
          <p className="text-xs text-muted-foreground">kg aujourd&apos;hui</p>
        </div>
        {delta !== null && Math.abs(delta) > 0.01 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              delta < 0 ? "text-good" : "text-muted-foreground"
            }`}
          >
            {delta < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} kg
          </div>
        )}
      </div>

      {progressPct !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${reached ? "bg-good" : "bg-primary"}`}
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {reached
              ? "Objectif atteint 🎉"
              : `Plus que ${remaining!.toFixed(1)} kg pour atteindre ton objectif (${targetWeight} kg)`}
          </p>
        </div>
      )}
    </div>
  );
}
