"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Article } from "@/types/sentiment";
import type { PricePoint } from "@/types/price";
import { useChartColors, type ChartColors } from "@/lib/chart-colors";
import { formatSignedScore } from "@/lib/sentiment";

/** Signed score in [-1, 1], matching how the server's summarize() weights a label. */
function signedScore(label: string, score: number) {
  const clamped = Math.max(0, Math.min(1, score));
  if (label === "positive") return clamped;
  if (label === "negative") return -clamped;
  return 0;
}

function rollingAvg(values: number[], window = 3): number[] {
  const out: number[] = [];
  const buf: number[] = [];
  let sum = 0;
  for (const v of values) {
    buf.push(v);
    sum += v;
    if (buf.length > window) sum -= buf.shift()!;
    out.push(sum / buf.length);
  }
  return out;
}

type Row = { date: string; price: number; sentiment: number; sentiment3: number };

/** "2026-08-13" is wider than the tick slot on a phone. The year is the same on every tick. */
function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  if (!month || !day) return iso;
  const name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    Number(month) - 1
  ];
  return name ? `${name} ${Number(day)}` : iso;
}

/**
 * Daily sentiment against the closing price, on the same days.
 *
 * Three series is one more than a chart usually wants, so they are ranked rather than given
 * equal weight. The rolling average is the signal and gets a solid line. The per-day bars are
 * context and sit behind it, coloured by direction so a glance reads green-above / red-below
 * without consulting a legend. The price is the other quantity entirely and takes the one
 * non-semantic colour in the palette.
 *
 * The x axis comes from the price dates, not the news dates: those are the days the market was
 * actually open, and hanging the sentiment off them is what makes the two comparable.
 */
export default function SentimentPriceChart({
  articles,
  prices,
  title = "Sentiment against price",
}: {
  articles: Article[];
  prices: PricePoint[];
  title?: string;
}) {
  const colors = useChartColors();

  const data = useMemo<Row[]>(() => {
    const daily = new Map<string, { sum: number; n: number }>();
    for (const a of articles) {
      const day = a.publishedAt?.slice(0, 10);
      if (!a.sentiment || !day) continue;
      const prev = daily.get(day) ?? { sum: 0, n: 0 };
      daily.set(day, {
        sum: prev.sum + signedScore(a.sentiment.label, a.sentiment.score),
        n: prev.n + 1,
      });
    }

    const sorted = [...(prices ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const perDay = sorted.map(({ date }) => {
      const agg = daily.get(date);
      return agg?.n ? Math.max(-1, Math.min(1, agg.sum / agg.n)) : 0;
    });
    const rolled = rollingAvg(perDay, 3);

    return sorted.map((p, i) => ({
      date: p.date,
      price: p.close,
      sentiment: perDay[i],
      sentiment3: rolled[i],
    }));
  }, [articles, prices]);

  if (!prices?.length) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No price series came back, so there is nothing to line the sentiment up against. Prices
        only exist for a ticker symbol, not for a topic search.
      </section>
    );
  }

  return (
    <section aria-label={title} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-zinc-500">Sentiment smoothed over 3 days</p>
      </div>

      {/* Height in rem rather than pixels, and the legend below sits outside it, so neither
          clips if the text wraps on a narrow screen. */}
      <div className="mt-3 h-72 w-full">
        {colors && (
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: colors.axis }}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                minTickGap={24}
              />
              <YAxis
                yAxisId="price"
                domain={["auto", "auto"]}
                width={52}
                tick={{ fontSize: 11, fill: colors.axis }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="sentiment"
                orientation="right"
                domain={[-1, 1]}
                ticks={[-1, 0, 1]}
                width={32}
                tick={{ fontSize: 11, fill: colors.axis }}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine yAxisId="sentiment" y={0} stroke={colors.grid} />
              <Tooltip
                cursor={{ stroke: colors.grid }}
                content={<ChartTooltip colors={colors} />}
              />
              {/* Capped and faint. Over a 7 day range recharts gives each bar a sixth of the
                  width, which turns the context series into the loudest thing on the chart. */}
              <Bar
                yAxisId="sentiment"
                dataKey="sentiment"
                maxBarSize={22}
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell
                    key={row.date}
                    fill={row.sentiment >= 0 ? colors.positive : colors.negative}
                    fillOpacity={0.35}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="sentiment"
                type="monotone"
                dataKey="sentiment3"
                dot={false}
                strokeWidth={2}
                stroke={colors.axis}
                isAnimationActive={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                dot={false}
                strokeWidth={2}
                stroke={colors.price}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <Key color={colors?.price} shape="line">
          closing price, left axis
        </Key>
        <Key color={colors?.axis} shape="line">
          sentiment over 3 days, right axis
        </Key>
        <Key color={colors?.positive} shape="bar">
          that day&apos;s headlines, green above zero, red below
        </Key>
      </ul>
    </section>
  );
}

function Key({
  color,
  shape,
  children,
}: {
  color?: string;
  shape: "line" | "bar";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={shape === "line" ? "h-0.5 w-4 rounded-full" : "h-2.5 w-2.5 rounded-sm"}
        style={{ background: color, opacity: shape === "bar" ? 0.45 : 1 }}
      />
      {children}
    </li>
  );
}

type TooltipPayload = { dataKey?: string | number; value?: number };

function ChartTooltip({
  active,
  payload,
  label,
  colors,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  colors: ChartColors;
}) {
  if (!active || !payload?.length) return null;

  const find = (key: string) => payload.find((p) => p.dataKey === key)?.value;
  const price = find("price");
  const sentiment = find("sentiment");
  const smoothed = find("sentiment3");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="font-medium tabular-nums">{label}</div>
      <dl className="mt-1 space-y-0.5">
        {typeof price === "number" && (
          <Line2 color={colors.price} term="close">
            {price.toFixed(2)}
          </Line2>
        )}
        {typeof smoothed === "number" && (
          <Line2 color={colors.axis} term="3-day sentiment">
            {formatSignedScore(smoothed)}
          </Line2>
        )}
        {typeof sentiment === "number" && (
          <Line2
            color={sentiment >= 0 ? colors.positive : colors.negative}
            term="that day"
          >
            {formatSignedScore(sentiment)}
          </Line2>
        )}
      </dl>
    </div>
  );
}

function Line2({
  color,
  term,
  children,
}: {
  color: string;
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <dt className="text-zinc-500">{term}</dt>
      <dd className="ml-auto pl-3 tabular-nums">{children}</dd>
    </div>
  );
}
