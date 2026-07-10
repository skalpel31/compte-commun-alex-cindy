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

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const width = 100;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const stroke = RING_COLOR[color] ?? "#8b5cf6";
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" preserveAspectRatio="none">
      <polygon points={areaPoints} fill={stroke} opacity={0.12} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
