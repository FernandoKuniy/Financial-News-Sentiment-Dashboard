"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { PricePoint } from "@/types/price";

export default function PriceMiniChart({ items }: { items: PricePoint[] }) {
  if (!items?.length) return null;
  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <LineChart data={items}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis domain={["auto", "auto"]} width={40} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} labelFormatter={(d) => `Date: ${d}`} />
          <Line type="monotone" dataKey="close" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
