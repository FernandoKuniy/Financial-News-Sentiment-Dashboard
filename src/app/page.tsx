"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useSentiment, type SentimentItem } from "@/hooks/useSentiment";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}


interface SentimentResponse {
  items: SentimentItem[];
}

export default function Home() {
  const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "FinSent";
  const [query, setQuery] = useState("AAPL");

  // News
  const { data: news, isLoading: newsLoading, error: newsErr } = useSWR<
    { items: NewsItem[]; count: number }
  >(query ? `/api/news?q=${encodeURIComponent(query)}&limit=25` : null, fetcher, {
    revalidateOnFocus: false,
  });

  // Sentiment
  const titles: string[] = news?.items?.map((n) => n.title) ?? [];
  const { data: sent, isLoading: sentLoading } = useSentiment(titles);

  const dist = useMemo(() => {
    return sent?.items?.reduce(
      (acc, s) => {
        if ('error' in s) acc.errors++;
        else acc[s.label]++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0, errors: 0 }
    ) ?? { positive: 0, neutral: 0, negative: 0, errors: 0 };
  }, [sent]);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] p-8 sm:p-12">
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Financial News</h1>
          <h2 className="text-2xl text-cyan-400 font-semibold">
            Sentiment Dashboard
          </h2>
          <p className="text-sm opacity-75">{APP}</p>
        </header>

        <section className="flex gap-3 justify-center">
          <input
            className="w-72 rounded-xl px-4 py-2 bg-neutral-900 border border-neutral-700"
            placeholder="Ticker or topic (e.g., AAPL, TSLA, Nvidia)"
            value={query}
            onChange={(e) => setQuery(e.target.value.trim())}
          />
        </section>

        <section className="grid sm:grid-cols-4 gap-3">
          <Card label="Positive" value={dist.positive} />
          <Card label="Neutral" value={dist.neutral} />
          <Card label="Negative" value={dist.negative} />
          <Card label="Errors" value={dist.errors} />
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Headlines</h3>
          {newsErr && <p className="text-red-400">Failed to load news.</p>}
          {(newsLoading || sentLoading) && (
            <p className="opacity-70">Loading…</p>
          )}
          <ul className="space-y-2">
            {news?.items?.map((n, i) => {
              const s = sent?.items?.[i];
              const badge =
                s && 'error' in s
                  ? "bg-gray-700"
                  : s?.label === "positive"
                  ? "bg-green-700"
                  : s?.label === "negative"
                  ? "bg-red-700"
                  : "bg-yellow-700";

              const text = s && 'error' in s ? "error" : s?.label ?? "pending";
              const score = s && "error" in s ? "" : ` (${(s as {score:number}).score.toFixed(2)})`;

              return (
                <li
                  key={n.url}
                  className="rounded-xl border border-neutral-800 p-3 flex items-start gap-3"
                >
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${badge}`}
                  >
                    {text}
                    {score}
                  </span>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs opacity-70">
                      {n.source} •{" "}
                      {new Date(n.publishedAt).toLocaleString()}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <footer className="row-start-3 mt-8 text-center opacity-60 text-sm">
        Data: NewsAPI, Alpha Vantage • Sentiment: FinBERT (Hugging Face)
      </footer>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4 text-center">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
