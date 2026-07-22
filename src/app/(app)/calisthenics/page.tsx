import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitnessGoalsSection } from "@/components/fitness-goals-section";
import { GenerateProgramSheet } from "@/components/generate-program-sheet";
import { TrainingProgramView } from "@/components/training-program-view";
import { LogWorkoutForm } from "@/components/log-workout-form";
import { WorkoutLogList } from "@/components/workout-log-list";
import { getCurrentProfile, getFitnessGoals, getLatestTrainingProgram, getWorkoutLogs } from "@/lib/data";

export default async function CalisthenicsPage() {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return null;
  }

  const [goals, program, logs] = await Promise.all([
    getFitnessGoals(currentProfile.id),
    getLatestTrainingProgram(currentProfile.id),
    getWorkoutLogs(currentProfile.id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calisthenics</h1>
        <p className="text-sm text-muted-foreground">
          Ton programme, privé — avec des niveaux adaptés à un débutant.
        </p>
      </div>

      <FitnessGoalsSection profileId={currentProfile.id} goals={goals} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Programme actuel</CardTitle>
          <GenerateProgramSheet profileId={currentProfile.id} hasProgram={!!program} />
        </CardHeader>
        <CardContent>
          {program ? (
            <TrainingProgramView program={program} />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun programme pour l&apos;instant — génère-en un pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      <LogWorkoutForm profileId={currentProfile.id} programId={program?.id ?? null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des séances</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutLogList logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
