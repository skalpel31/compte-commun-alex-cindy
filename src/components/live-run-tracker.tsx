"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RunMap } from "@/components/run-map";
import { saveRun } from "@/lib/actions";
import { computeRouteDistance, formatDistance, formatDuration, formatPace } from "@/lib/geo";
import type { Profile, RunPoint } from "@/lib/types";

type WakeLockSentinel = { release: () => Promise<void> };

export function LiveRunTracker({ profiles, defaultProfileId }: { profiles: Profile[]; defaultProfileId: string }) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(defaultProfileId);
  const [running, setRunning] = useState(false);
  const [points, setPoints] = useState<RunPoint[]>([]);
  const [elapsedS, setElapsedS] = useState(0);
  const [saving, setSaving] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const distanceM = computeRouteDistance(points);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  async function handleStart() {
    if (!("geolocation" in navigator)) {
      setGeoError("Ton navigateur ne supporte pas la géolocalisation.");
      return;
    }
    setGeoError(null);
    setPoints([]);
    setElapsedS(0);
    startedAtRef.current = new Date().toISOString();
    setRunning(true);

    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } };
      wakeLockRef.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      // Wake lock isn't critical — the run still tracks, the screen just
      // might dim/lock sooner and pause GPS updates until it's woken.
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPoints((prev) => [
          ...prev,
          { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() },
        ]);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Géolocalisation refusée — autorise-la pour suivre ta course."
            : "Impossible de récupérer ta position."
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    timerRef.current = setInterval(() => setElapsedS((s) => s + 1), 1000);
  }

  async function handleStop() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    await wakeLockRef.current?.release().catch(() => {});
    setRunning(false);

    if (points.length < 2) {
      toast.error("Course trop courte pour être enregistrée");
      return;
    }

    setSaving(true);
    try {
      const runId = await saveRun({
        profileId,
        startedAt: startedAtRef.current ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        distanceM,
        durationS: elapsedS,
        route: points,
      });
      toast.success("Course enregistrée");
      router.push(`/course-a-pied/${runId}`);
    } catch (err) {
      toast.error("Échec de l'enregistrement", { description: err instanceof Error ? err.message : undefined });
      setSaving(false);
    }
  }

  const pace = formatPace(distanceM, elapsedS);

  return (
    <div className="flex flex-col gap-4">
      {!running && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Pour qui ?</p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfileId(p.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  profileId === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {geoError && <p className="text-sm text-critical">{geoError}</p>}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Durée</p>
          <p className="text-lg font-semibold tabular-nums">{formatDuration(elapsedS)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="text-lg font-semibold tabular-nums">{formatDistance(distanceM)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Allure</p>
          <p className="text-lg font-semibold tabular-nums">{pace ?? "—"}</p>
        </div>
      </div>

      <RunMap points={points} className="h-72 w-full overflow-hidden rounded-lg" />

      {running ? (
        <Button variant="destructive" onClick={handleStop} disabled={saving}>
          <Square className="size-4" />
          {saving ? "Enregistrement..." : "Terminer"}
        </Button>
      ) : (
        <Button onClick={handleStart}>
          <Play className="size-4" />
          Démarrer
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Garde l&apos;app ouverte et l&apos;écran allumé pendant la course — le suivi s&apos;arrête si tu
        verrouilles le téléphone ou changes d&apos;application.
      </p>
    </div>
  );
}
