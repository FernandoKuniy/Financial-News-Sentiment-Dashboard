"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function SentimentBar({
  pos, neu, neg,
}: { pos: number; neu: number; neg: number }) {
  const data = [
    { k: "Pos", v: pos, fill: "#16a34a" },   // green-600
    { k: "Neu", v: neu, fill: "#ca8a04" },   // yellow-600
    { k: "Neg", v: neg, fill: "#dc2626" },   // red-600
  ];
  return (
    <div className="w-full h-64 rounded-2xl border border-neutral-800 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <XAxis dataKey="k" stroke="#a3a3a3" />
          <YAxis allowDecimals={false} stroke="#a3a3a3" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", color: "#e5e5e5" }}
          />
          <Bar dataKey="v">
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
