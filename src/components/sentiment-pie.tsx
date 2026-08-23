"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import type { AnalyzeSummary } from "@/types/sentiment";
import { normalizeSummary } from "@/lib/sentiment";
import { useChartColors } from "@/lib/chart-colors";

/**
 * The split between positive, neutral and negative.
 *
 * A donut rather than a filled pie, so the total sits in the middle where a reader looks first.
 * The labels moved off the slices and into a legend underneath: slice labels on a three-part
 * chart collide as soon as one share gets small, and they were being drawn outside the box.
 *
 * No tooltip. Every value is already written in the legend, so hovering could only repeat it.
 */
export default function SentimentPie({ s }: { s: AnalyzeSummary }) {
  const n = normalizeSummary(s);
  const colors = useChartColors();

  if (n.total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        None of these headlines came back with a score.
      </div>
    );
  }

  const slices = [
    { key: "positive", label: "positive", value: n.pos, pct: n.posPct, color: colors?.positive },
    { key: "neutral", label: "neutral", value: n.neu, pct: n.neuPct, color: colors?.neutral },
    { key: "negative", label: "negative", value: n.neg, pct: n.negPct, color: colors?.negative },
  ];

  return (
    <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-sm font-medium">How the headlines split</h2>

      <div className="relative mt-3 h-40">
        {colors && (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{n.total}</span>
          <span className="text-xs text-zinc-500">headlines</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-400">{slice.label}</span>
            <span className="ml-auto tabular-nums">
              {slice.value}{" "}
              <span className="text-zinc-500">({Math.round(slice.pct)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
