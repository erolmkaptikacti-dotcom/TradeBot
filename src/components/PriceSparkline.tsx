"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function PriceSparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return <div className="h-12 w-full" />;
  }

  const trendUp = data[data.length - 1] >= data[0];
  const color = trendUp ? "var(--status-good)" : "var(--status-critical)";
  const points = data.map((value, index) => ({ index, value }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.1 || max * 0.01;

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[min - pad, max + pad]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
