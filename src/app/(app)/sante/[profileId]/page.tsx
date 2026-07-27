import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/trend-chart";
import { WeightLogForm } from "@/components/weight-log-form";
import { WeightHistoryList } from "@/components/weight-history-list";
import { HealthSettingsForm } from "@/components/health-settings-form";
import { BmiScale } from "@/components/bmi-scale";
import { WeightGoalProgress } from "@/components/weight-goal-progress";
import { MetabolismStats } from "@/components/metabolism-stats";
import { computeBmi, getHealthProfile, getVisibleHealthProfiles, getWeightLogs } from "@/lib/data";

export default async function SanteProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const visibleProfiles = await getVisibleHealthProfiles();
  const profile = visibleProfiles.find((p) => p.id === profileId);
  if (!profile) notFound();

  const [healthProfile, logs] = await Promise.all([getHealthProfile(profileId), getWeightLogs(profileId)]);

  const chartData = [...logs].reverse().map((l) => ({ date: l.date, weight_kg: l.weight_kg }));
  const latest = logs[0] ?? null;
  const previous = logs[1] ?? null;
  const first = logs[logs.length - 1] ?? null;
  const bmi = latest && healthProfile?.height_cm ? computeBmi(latest.weight_kg, healthProfile.height_cm) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{profile.display_name}</h1>
        <p className="text-sm text-muted-foreground">Suivi du poids et de l&apos;IMC.</p>
      </div>

      {latest && (
        <Card>
          <CardContent className="grid gap-6 py-5 sm:grid-cols-2">
            <WeightGoalProgress
              currentWeight={latest.weight_kg}
              previousWeight={previous?.weight_kg ?? null}
              firstWeight={first?.weight_kg ?? latest.weight_kg}
              targetWeight={healthProfile?.target_weight_kg ?? null}
            />
            {bmi !== null && (
              <div className="flex items-center">
                <BmiScale bmi={bmi} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {latest && healthProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ton objectif calorique</CardTitle>
          </CardHeader>
          <CardContent>
            <MetabolismStats healthProfile={healthProfile} currentWeight={latest.weight_kg} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution du poids</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {chartData.length > 1 ? (
            <TrendChart
              data={chartData}
              xKey="date"
              yKey="weight_kg"
              mode="day"
              unit="kg"
              seriesName="Poids (kg)"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ajoute au moins deux pesées pour voir la courbe.
            </p>
          )}
        </CardContent>
      </Card>

      <WeightLogForm profileId={profileId} />
      <HealthSettingsForm profileId={profileId} healthProfile={healthProfile} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightHistoryList logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
