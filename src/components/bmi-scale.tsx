const SCALE_MIN = 15;
const SCALE_MAX = 42;

const ZONES = [
  { label: "Maigreur", range: "<18.5", min: 15, max: 18.5, barClass: "bg-chart-2", pillClass: "bg-chart-2/15 text-chart-2" },
  { label: "Normal", range: "18.5-25", min: 18.5, max: 25, barClass: "bg-good", pillClass: "bg-good/15 text-good" },
  { label: "Surpoids", range: "25-30", min: 25, max: 30, barClass: "bg-warning", pillClass: "bg-warning/15 text-warning" },
  { label: "Obésité modérée", range: "30-40", min: 30, max: 40, barClass: "bg-chart-6", pillClass: "bg-chart-6/15 text-chart-6" },
  { label: "Obésité sévère", range: ">40", min: 40, max: 42, barClass: "bg-critical", pillClass: "bg-critical/15 text-critical" },
];

function zoneFor(bmi: number) {
  return ZONES.find((z) => bmi < z.max) ?? ZONES[ZONES.length - 1];
}

export function BmiScale({ bmi }: { bmi: number }) {
  const markerPct = Math.min(100, Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));
  const zone = zoneFor(bmi);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Indice de masse corporelle</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${zone.pillClass}`}>{zone.label}</span>
      </div>
      <p className="text-3xl font-semibold tabular-nums">{bmi.toFixed(1)}</p>
      <div className="relative mt-1 h-2.5 w-full overflow-visible rounded-full">
        <div className="flex h-full w-full overflow-hidden rounded-full">
          {ZONES.map((z) => (
            <div
              key={z.label}
              className={z.barClass}
              style={{ width: `${((z.max - z.min) / (SCALE_MAX - SCALE_MIN)) * 100}%` }}
            />
          ))}
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${markerPct}%` }}
        >
          <div className="size-4 rounded-full border-2 border-background bg-foreground shadow-sm" />
        </div>
      </div>
      <div className="flex text-[10px] text-muted-foreground">
        {ZONES.map((z) => (
          <div
            key={z.label}
            className="flex flex-col items-center gap-0.5 px-0.5 text-center"
            style={{ width: `${((z.max - z.min) / (SCALE_MAX - SCALE_MIN)) * 100}%` }}
          >
            <span className="leading-tight">{z.label}</span>
            <span className="tabular-nums opacity-70">{z.range}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Repère indicatif (OMS) — ne remplace pas un avis médical.
      </p>
    </div>
  );
}
