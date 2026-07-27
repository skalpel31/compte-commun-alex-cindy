"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatAmount, formatDate } from "@/lib/format";

function monthTick(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(value + "-02"));
}

/**
 * `mode` (not function props) picks the tick/value formatting — a Server
 * Component can't pass a plain function to a Client Component (React can't
 * serialize it across that boundary), so every caller-specific bit of
 * formatting has to live in here, keyed by a plain string instead.
 */
export function TrendChart({
  data,
  xKey = "month",
  yKey = "total",
  mode = "month",
  unit,
  seriesName = "Dépenses",
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  mode?: "month" | "day";
  unit?: string;
  seriesName?: string;
}) {
  const xTickFormatter = mode === "day" ? (value: string) => formatDate(value) : monthTick;
  const valueFormatter = (value: number) =>
    mode === "day" ? `${value}${unit ? ` ${unit}` : ""}` : formatAmount(value);

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            tickFormatter={xTickFormatter}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => valueFormatter(Number(value))}
            labelFormatter={(label) => xTickFormatter(String(label))}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            name={seriesName}
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
