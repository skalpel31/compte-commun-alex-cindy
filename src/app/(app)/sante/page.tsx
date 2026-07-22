import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthProfileCard } from "@/components/health-profile-card";
import { AddMemberSheet } from "@/components/add-member-sheet";
import { getVisibleHealthProfiles, getHealthProfile, getWeightLogs } from "@/lib/data";

export default async function SantePage() {
  const profiles = await getVisibleHealthProfiles();

  const rows = await Promise.all(
    profiles.map(async (profile) => {
      const [healthProfile, logs] = await Promise.all([
        getHealthProfile(profile.id),
        getWeightLogs(profile.id),
      ]);
      return { profile, healthProfile, latestLog: logs[0] ?? null };
    })
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Santé</h1>
        <p className="text-sm text-muted-foreground">
          Ton suivi est privé — celui des enfants est visible par les deux parents.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vos profils</CardTitle>
          <AddMemberSheet />
        </CardHeader>
        <CardContent className="divide-y">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun profil pour l&apos;instant.
            </p>
          ) : (
            rows.map(({ profile, healthProfile, latestLog }) => (
              <HealthProfileCard
                key={profile.id}
                profile={profile}
                healthProfile={healthProfile}
                latestLog={latestLog}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
