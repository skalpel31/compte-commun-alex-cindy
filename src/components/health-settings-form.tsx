"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertHealthProfile } from "@/lib/actions";
import type { HealthProfile } from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids: "Perte de poids",
  prise_de_masse: "Prise de masse",
  maintien: "Maintien",
};

export function HealthSettingsForm({
  profileId,
  healthProfile,
}: {
  profileId: string;
  healthProfile: HealthProfile | null;
}) {
  const router = useRouter();
  const [height, setHeight] = useState(healthProfile?.height_cm ? String(healthProfile.height_cm) : "");
  const [targetWeight, setTargetWeight] = useState(
    healthProfile?.target_weight_kg ? String(healthProfile.target_weight_kg) : ""
  );
  const [calorieTarget, setCalorieTarget] = useState(
    healthProfile?.daily_calorie_target ? String(healthProfile.daily_calorie_target) : ""
  );
  const [goalType, setGoalType] = useState<string>(healthProfile?.goal_type ?? "none");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertHealthProfile(profileId, {
          height_cm: height ? parseFloat(height.replace(",", ".")) : null,
          target_weight_kg: targetWeight ? parseFloat(targetWeight.replace(",", ".")) : null,
          daily_calorie_target: calorieTarget ? parseFloat(calorieTarget.replace(",", ".")) : null,
          goal_type: goalType === "none" ? null : (goalType as HealthProfile["goal_type"]),
        });
        toast.success("Profil santé mis à jour");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Objectif</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="height">Taille (cm)</Label>
          <Input id="height" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target-weight">Poids cible (kg)</Label>
          <Input
            id="target-weight"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>But</Label>
          <Select value={goalType} onValueChange={(v) => setGoalType(v ?? "none")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Aucun">
                {(value: string) => (value === "none" ? "Aucun" : GOAL_LABELS[value])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calorie-target">Calories cibles/jour</Label>
          <Input
            id="calorie-target"
            inputMode="decimal"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={pending} size="sm" className="self-end">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}
