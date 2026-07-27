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
import { ACTIVITY_LABELS, type ActivityLevel, type Sex } from "@/lib/health";
import type { HealthProfile } from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  perte_de_poids: "Perte de poids",
  prise_de_masse: "Prise de masse",
  maintien: "Maintien",
};

const SEX_LABELS: Record<Sex, string> = { homme: "Homme", femme: "Femme" };

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
  const [goalType, setGoalType] = useState<string>(healthProfile?.goal_type ?? "none");
  const [age, setAge] = useState(healthProfile?.age ? String(healthProfile.age) : "");
  const [sex, setSex] = useState<string>(healthProfile?.sex ?? "none");
  const [activityLevel, setActivityLevel] = useState<string>(healthProfile?.activity_level ?? "none");
  const [durationMonths, setDurationMonths] = useState(
    healthProfile?.goal_duration_months ? String(healthProfile.goal_duration_months) : ""
  );
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertHealthProfile(profileId, {
          height_cm: height ? parseFloat(height.replace(",", ".")) : null,
          target_weight_kg: targetWeight ? parseFloat(targetWeight.replace(",", ".")) : null,
          goal_type: goalType === "none" ? null : (goalType as HealthProfile["goal_type"]),
          age: age ? parseInt(age, 10) : null,
          sex: sex === "none" ? null : (sex as Sex),
          activity_level: activityLevel === "none" ? null : (activityLevel as ActivityLevel),
          goal_duration_months: durationMonths ? parseFloat(durationMonths.replace(",", ".")) : null,
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
      <p className="text-sm font-medium">Ton profil</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="height">Taille (cm)</Label>
          <Input id="height" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="age">Âge</Label>
          <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Sexe</Label>
          <Select value={sex} onValueChange={(v) => setSex(v ?? "none")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Non renseigné">
                {(value: string) => (value === "none" ? "Non renseigné" : SEX_LABELS[value as Sex])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Non renseigné</SelectItem>
              {Object.entries(SEX_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Niveau d&apos;activité</Label>
          <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v ?? "none")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Non renseigné">
                {(value: string) =>
                  value === "none" ? "Non renseigné" : ACTIVITY_LABELS[value as ActivityLevel]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Non renseigné</SelectItem>
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-1 text-sm font-medium">Objectif</p>
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
          <Label htmlFor="target-weight">Poids cible (kg)</Label>
          <Input
            id="target-weight"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duration-months">En combien de mois ? (optionnel)</Label>
        <Input
          id="duration-months"
          inputMode="decimal"
          placeholder="ex. 3"
          value={durationMonths}
          onChange={(e) => setDurationMonths(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tes calories/jour sont calculées automatiquement à partir de ces infos — utilisées aussi pour
        tes portions dans les repas générés par l&apos;IA.
      </p>
      <Button onClick={handleSave} disabled={pending} size="sm" className="self-end">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}
