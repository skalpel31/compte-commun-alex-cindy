import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { computeBmi } from "@/lib/data";
import type { HealthProfile, Profile, WeightLog } from "@/lib/types";

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return { text: "Insuffisance pondérale", className: "text-warning" };
  if (bmi < 25) return { text: "Corpulence normale", className: "text-good" };
  if (bmi < 30) return { text: "Surpoids", className: "text-warning" };
  return { text: "Obésité", className: "text-critical" };
}

export function HealthProfileCard({
  profile,
  healthProfile,
  latestLog,
}: {
  profile: Profile;
  healthProfile: HealthProfile | null;
  latestLog: WeightLog | null;
}) {
  const bmi =
    latestLog && healthProfile?.height_cm ? computeBmi(latestLog.weight_kg, healthProfile.height_cm) : null;
  const meta = bmi !== null ? bmiLabel(bmi) : null;

  return (
    <Link
      href={`/sante/${profile.id}`}
      className="flex items-center gap-3 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile.display_name}</p>
        {latestLog ? (
          <p className="text-xs text-muted-foreground">
            {latestLog.weight_kg} kg
            {bmi !== null && meta && (
              <>
                {" "}
                · IMC {bmi.toFixed(1)} · <span className={meta.className}>{meta.text}</span>
              </>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune pesée enregistrée</p>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
