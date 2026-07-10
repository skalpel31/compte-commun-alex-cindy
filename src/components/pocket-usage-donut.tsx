"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";

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

export type PocketUsage = { id: string; name: string; icon: string; color: string; spent: number };

export function PocketUsageDonut({ usage, total }: { usage: PocketUsage[]; total: number }) {
  const data = usage.filter((u) => u.spent > 0);

  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Pas encore de dépenses ce mois-ci.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="spent"
              nameKey="name"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={RING_COLOR[d.color] ?? "#8b5cf6"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatAmount(Number(value))}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Dépenses totales</span>
          <span className="text-lg font-semibold tabular-nums">{formatAmount(total)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-sm">
            <span className={`size-2.5 shrink-0 rounded-full ${categoryBg(d.color)}`} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className={`shrink-0 text-xs font-medium ${categoryText(d.color)}`}>
              {Math.round((d.spent / total) * 100)}%
            </span>
            <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {formatAmount(d.spent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
