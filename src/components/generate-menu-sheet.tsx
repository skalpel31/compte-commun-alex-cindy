"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { generateWeeklyMenu } from "@/lib/actions";

export function GenerateMenuSheet({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        await generateWeeklyMenu(weekStart, preferences);
        toast.success("Menu de la semaine généré");
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
        Générer le menu
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Générer le menu de la semaine</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            <Label htmlFor="menu-preferences">Envies, contraintes, objectifs...</Label>
            <Textarea
              id="menu-preferences"
              placeholder="ex. pas de poisson, envie de plats d'été, léger le soir..."
              rows={4}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Remplace le menu déjà prévu cette semaine-ci, en respectant qui mange quel repas et
              les objectifs de chacun.
            </p>
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
