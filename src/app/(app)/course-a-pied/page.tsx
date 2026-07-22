import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RunHistoryRow } from "@/components/run-history-row";
import { getRuns } from "@/lib/data";

export default async function CourseAPiedPage() {
  const runs = await getRuns();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Course à pied</h1>
          <p className="text-sm text-muted-foreground">Suivi GPS en direct, partagé avec tout le foyer.</p>
        </div>
        <Button size="sm" render={<Link href="/course-a-pied/nouvelle" />}>
          <Plus className="size-4" />
          Nouvelle course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune course enregistrée — lance-toi !
            </p>
          ) : (
            runs.map((run) => <RunHistoryRow key={run.id} run={run} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
