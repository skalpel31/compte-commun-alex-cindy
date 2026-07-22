"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { generateTrainingProgram } from "@/lib/actions";

export function GenerateProgramSheet({
  profileId,
  hasProgram,
}: {
  profileId: string;
  hasProgram: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasPullupBar, setHasPullupBar] = useState(true);
  const [sessionsPerWeek, setSessionsPerWeek] = useState("1");
  const [preferences, setPreferences] = useState("");
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    const sessions = parseInt(sessionsPerWeek, 10);
    if (!sessions || sessions < 1) {
      toast.error("Indique au moins une séance par semaine");
      return;
    }
    startTransition(async () => {
      try {
        await generateTrainingProgram(profileId, hasPullupBar, sessions, preferences);
        toast.success("Programme généré");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec de la génération", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        {hasProgram ? "Régénérer le programme" : "Générer mon programme"}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{hasProgram ? "Régénérer le programme" : "Générer mon programme"}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">J&apos;ai une barre de traction</p>
              </div>
              <Switch checked={hasPullupBar} onCheckedChange={setHasPullupBar} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sessions-per-week">Séances de musculation par semaine</Label>
              <Input
                id="sessions-per-week"
                type="number"
                min={1}
                max={7}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="program-preferences">
                {hasProgram ? "Tes progrès / ce qui a changé" : "Contraintes ou envies particulières"}
              </Label>
              <Textarea
                id="program-preferences"
                rows={4}
                placeholder={
                  hasProgram
                    ? "ex. les pompes sur genoux sont trop faciles maintenant, je veux passer au niveau suivant..."
                    : "ex. je débute vraiment, jamais fait de sport avant..."
                }
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button onClick={handleGenerate} disabled={pending}>
              {pending ? "Génération..." : "Générer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
