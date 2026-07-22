import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/trend-chart";
import { WeightLogForm } from "@/components/weight-log-form";
import { WeightHistoryList } from "@/components/weight-history-list";
import { HealthSettingsForm } from "@/components/health-settings-form";
import { computeBmi, getHealthProfile, getVisibleHealthProfiles, getWeightLogs } from "@/lib/data";
import { formatDate } from "@/lib/format";

function dayTick(value: string) {
  return formatDate(value);
}

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
  const bmi = latest && healthProfile?.height_cm ? computeBmi(latest.weight_kg, healthProfile.height_cm) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{profile.display_name}</h1>
        <p className="text-sm text-muted-foreground">Suivi du poids et de l&apos;IMC.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution du poids</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-4">
            {latest && <p className="text-2xl font-semibold tabular-nums">{latest.weight_kg} kg</p>}
            {bmi !== null && <p className="text-sm text-muted-foreground">IMC {bmi.toFixed(1)}</p>}
          </div>
          {chartData.length > 1 ? (
            <TrendChart
              data={chartData}
              xKey="date"
              yKey="weight_kg"
              xTickFormatter={dayTick}
              seriesName="Poids (kg)"
              valueFormatter={(v) => `${v} kg`}
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
