"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { AnalyzeSummary } from "@/types/sentiment";

const COLORS = ["#22c55e", "#64748b", "#ef4444"]; // green, gray, red

export default function SentimentPie({ s }: { s: AnalyzeSummary }) {
  const pos = "pos" in s ? s.pos : s.positive;
  const neu = "neu" in s ? s.neu : s.neutral;
  const neg = "neg" in s ? s.neg : s.negative;
  const total = pos + neu + neg || 1;

  const data = [
    { name: "Positive", value: pos },
    { name: "Neutral", value: neu },
    { name: "Negative", value: neg },
  ].map((d) => ({ ...d, percent: Math.round((d.value / total) * 100) }));

  return (
    <div className="w-full h-64 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} (${percent}%)`}
            labelStyle={{ fill: "#e5e7eb", fontSize: 12 }}
          >
            {data.map((entry, idx) => (
              <Cell key={entry.name} fill={COLORS[idx]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(v: number, name) => [`${v}`, name]} 
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#e5e7eb" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
