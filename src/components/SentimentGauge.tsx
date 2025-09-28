"use client";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

function toPct(score: number) { return Math.max(0, Math.min(100, ((score + 1) / 2) * 100)); }
function colorFor(score: number) {
  if (score <= -0.2) return "#dc2626";   // red-600
  if (score >=  0.2) return "#16a34a";   // green-600
  return "#ca8a04";                      // yellow-600
}

export default function SentimentGauge({ score }: { score: number }) {
  const pct = toPct(score ?? 0);
  const fill = colorFor(score ?? 0);
  const data = [{ name: "score", value: pct }];

  return (
    <div className="w-full h-64 rounded-2xl border border-neutral-800 p-3 grid place-items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius="70%"
          outerRadius="100%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          {/* background track */}
          <RadialBar data={[{ value: 100 }]} dataKey="value" cornerRadius={8} fill="#1f2937" />{/* gray-800 */}
          {/* foreground value */}
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#1f2937" }} fill={fill} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-16">
        <div className="text-2xl font-bold">{(score ?? 0).toFixed(2)}</div>
        <div className="text-xs opacity-70">Weighted sentiment (−1 to +1)</div>
      </div>
    </div>
  );
}

