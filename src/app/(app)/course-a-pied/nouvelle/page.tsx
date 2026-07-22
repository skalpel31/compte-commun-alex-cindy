import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeezerLinkButton } from "@/components/deezer-link-button";
import { LiveRunTracker } from "@/components/live-run-tracker";
import { getCurrentProfile, getProfiles } from "@/lib/data";

export default async function NouvelleCoursePage() {
  const [profiles, currentProfile] = await Promise.all([getProfiles(), getCurrentProfile()]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nouvelle course</h1>
          <p className="text-sm text-muted-foreground">Suivi GPS en direct.</p>
        </div>
        <DeezerLinkButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">En direct</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveRunTracker profiles={profiles} defaultProfileId={currentProfile?.id ?? profiles[0]?.id ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
