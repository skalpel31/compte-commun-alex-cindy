"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatAmount } from "@/lib/format";

function monthTick(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(value + "-02"));
}

/**
 * Defaults reproduce the original monthly-spend chart exactly (xKey="month",
 * yKey="total", month-name ticks, amounts formatted as currency) — other
 * callers (e.g. a daily weight trend) override the keys/formatters instead
 * of needing a separate chart component for what's the same shell.
 */
export function TrendChart({
  data,
  xKey = "month",
  yKey = "total",
  xTickFormatter = monthTick,
  seriesName = "Dépenses",
  valueFormatter = (v: number) => formatAmount(v),
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  xTickFormatter?: (value: string) => string;
  seriesName?: string;
  valueFormatter?: (value: number) => string;
}) {
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
