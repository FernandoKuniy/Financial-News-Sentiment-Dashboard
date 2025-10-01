"use client";

import { useMemo } from "react";
import type { Article } from "@/types/sentiment";
import type { PricePoint } from "@/types/price";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/** Map FinBERT label+score -> signed score in [-1,1] consistent with server summarize() */
function signedScore(label: string, score: number) {
  if (label === "positive") return +Math.max(0, Math.min(1, score));
  if (label === "negative") return -Math.max(0, Math.min(1, score));
  return 0; // neutral
}

/** YYYY-MM-DD from ISO */
function day(iso: string) {
  return iso?.slice(0, 10);
}

function rollingAvg(values: Array<{ date: string; value: number }>, window = 3) {
  const out: Array<{ date: string; value: number }> = [];
  let sum = 0;
  const buf: number[] = [];
  for (const item of values) {
    buf.push(item.value);
    sum += item.value;
    if (buf.length > window) sum -= buf.shift()!;
    const avg = sum / buf.length;
    out.push({ date: item.date, value: Number.isFinite(avg) ? avg : 0 });
  }
  return out;
}

export default function SentimentPriceChart({
  articles,
  prices,
  title = "Sentiment vs Price",
}: {
  articles: Article[];
  prices: PricePoint[];
  title?: string;
}) {
  // Build daily avg sentiment from articles
  const data = useMemo(() => {
    // group by day -> {sum, n}
    const daily = new Map<string, { sum: number; n: number }>();
    for (const a of articles) {
      if (!a?.sentiment) continue;
      const d = day(a.publishedAt);
      if (!d) continue;
      const signed = signedScore(a.sentiment.label, a.sentiment.score);
      const prev = daily.get(d) || { sum: 0, n: 0 };
      daily.set(d, { sum: prev.sum + signed, n: prev.n + 1 });
    }

    // Make aligned array based on price dates (sorted asc) to keep the viewport tidy
    const sortedPrices = [...(prices || [])].sort((a, b) => a.date.localeCompare(b.date));
    const sentimentByDate = sortedPrices.map(({ date }) => {
      const agg = daily.get(date);
      const avg = agg && agg.n ? Math.max(-1, Math.min(1, agg.sum / agg.n)) : 0;
      return { date, value: avg };
    });

    const rolled = rollingAvg(sentimentByDate, 3);
    const rolledMap = new Map(rolled.map((r) => [r.date, r.value]));

    // Final join
    return sortedPrices.map((p) => ({
      date: p.date,
      price: p.close,
      sentiment: sentimentByDate.find((s) => s.date === p.date)?.value ?? 0,
      sentiment3: rolledMap.get(p.date) ?? 0,
    }));
  }, [articles, prices]);

  if (!prices?.length) return null;

  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-700 mb-2">{title} <span className="text-xs text-slate-500">(3‑day rolling sentiment)</span></h2>
      <div className="w-full h-72">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={16} />
            <YAxis yAxisId="left" domain={["auto", "auto"]} width={48} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} width={40} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v, _name, entry) => {
                const key = (entry as { dataKey?: unknown } | undefined)?.dataKey;
                const val = typeof v === "number" ? v.toFixed(2) : String(v);
                if (key === "price") return [val, "Close"];
                if (key === "sentiment3") return [val, "Sentiment (3d)"];
                return [val, "Sentiment (daily)"];
              }}
              labelStyle={{ color: "#374151" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {/* Price line on left axis */}
            <Line yAxisId="left" type="monotone" dataKey="price" dot={false} name="Close" stroke="#1f77b4" />
            {/* Sentiment bar (daily avg) for context */}
            <Bar yAxisId="right" dataKey="sentiment" name="Sentiment (daily)" fill="#f59e0b" opacity={0.35} />
            {/* Rolling 3-day sentiment line on right axis */}
            <Line yAxisId="right" type="monotone" dataKey="sentiment3" dot={false} name="Sentiment (3d)" stroke="#16a34a" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-600">Right axis: sentiment in [−1, 1]. Left axis: closing price.</p>
    </section>
  );
}