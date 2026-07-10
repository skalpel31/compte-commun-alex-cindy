import { formatAmount } from "@/lib/format";
import type { PocketBalance } from "@/lib/data";

const RING_COLOR: Record<string, string> = {
  "chart-1": "#4f8cff",
  "chart-2": "#16d19b",
  "chart-3": "#f2b13d",
  "chart-4": "#22c55e",
  "chart-5": "#a78bfa",
  "chart-6": "#fb7185",
  "chart-7": "#ec4899",
  "chart-8": "#fb923c",
};

export function MoneyHub({ pockets, total }: { pockets: PocketBalance[]; total: number }) {
  const positive = pockets.filter((p) => p.balance > 0);
  const sum = positive.reduce((s, p) => s + p.balance, 0) || 1;

  const stops = positive.reduce<{ text: string[]; cursor: number }>(
    (acc, p) => {
      const start = (acc.cursor / sum) * 360;
      const cursor = acc.cursor + p.balance;
      const end = (cursor / sum) * 360;
      return {
        text: [...acc.text, `${RING_COLOR[p.color] ?? "#8b5cf6"} ${start}deg ${end}deg`],
        cursor,
      };
    },
    { text: [], cursor: 0 }
  ).text;
  const ringStyle =
    stops.length > 0
      ? { background: `conic-gradient(${stops.join(", ")})` }
      : { background: "conic-gradient(#8b5cf6 0deg 360deg)" };

  return (
    <div className="glass relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl p-8 text-center shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, #8b5cf6, transparent 60%), radial-gradient(circle at 75% 75%, #ec4899, transparent 55%), radial-gradient(circle at 20% 85%, #4f8cff, transparent 55%)",
        }}
      />
      <div className="relative flex size-40 items-center justify-center rounded-full p-1.5" style={ringStyle}>
        <div className="flex size-full flex-col items-center justify-center gap-0.5 rounded-full bg-background">
          <span className="text-xs text-muted-foreground">Argent du foyer</span>
          <span className="text-2xl font-semibold tabular-nums">{formatAmount(total)}</span>
        </div>
      </div>
    </div>
  );
}
