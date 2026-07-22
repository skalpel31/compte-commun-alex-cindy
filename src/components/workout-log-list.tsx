import { formatDate } from "@/lib/format";
import type { WorkoutLog } from "@/lib/types";

export function WorkoutLogList({ logs }: { logs: WorkoutLog[] }) {
  if (logs.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Aucune séance enregistrée.</p>;
  }

  return (
    <div className="flex flex-col divide-y">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">{formatDate(log.date)}</span>
          {log.notes && <span className="text-xs text-muted-foreground">{log.notes}</span>}
        </div>
      ))}
    </div>
  );
}
