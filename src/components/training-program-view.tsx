import type { TrainingProgram } from "@/lib/types";

export function TrainingProgramView({ program }: { program: TrainingProgram }) {
  return (
    <div className="flex flex-col gap-4">
      {program.sessions.map((session, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p className="text-sm font-medium">{session.name}</p>
          <div className="flex flex-col gap-2">
            {session.exercises.map((ex, j) => (
              <div key={j} className="flex flex-col gap-1 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{ex.name}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Niveau {ex.current_level}/{ex.total_levels}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{ex.level_name}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {ex.sets} séries × {ex.reps_or_duration}
                </p>
                {ex.next_level_name && (
                  <p className="text-xs text-muted-foreground">
                    Niveau suivant : <span className="font-medium">{ex.next_level_name}</span> —{" "}
                    {ex.progression_criteria}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
