"use client";

import { useState } from "react";
import { useAnalyze } from "@/hooks/useAnalyze";
import SentimentBar from "@/components/SentimentBar";
import SentimentGauge from "@/components/SentimentGauge";
import { SkeletonCard, SkeletonChart, SkeletonList } from "@/components/Skeletons";


export default function Home() {
  const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "FinSent";
  const [query, setQuery] = useState("AAPL");

  const { data, error, isLoading } = useAnalyze(query, 25);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] p-8 sm:p-12">
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Financial News</h1>
          <h2 className="text-2xl text-cyan-400 font-semibold">Sentiment Dashboard</h2>
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
          {isLoading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <Card label="Positive" value={data?.summary.positive ?? 0} />
              <Card label="Neutral" value={data?.summary.neutral ?? 0} />
              <Card label="Negative" value={data?.summary.negative ?? 0} />
              <Card label="Score" value={Number((data?.summary.score ?? 0).toFixed(2))} />
            </>
          )}
        </section>

        {error && <p className="text-red-400">Failed to analyze.</p>}

        <section className="grid sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : (
            <>
              <SentimentBar
                pos={data?.summary.positive ?? 0}
                neu={data?.summary.neutral ?? 0}
                neg={data?.summary.negative ?? 0}
              />
              <SentimentGauge score={data?.summary.score ?? 0} />
            </>
          )}
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Top Positive</h3>
            {isLoading ? <SkeletonList rows={3} /> : <List title="" items={data?.topPositive ?? []} />}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Top Negative</h3>
            {isLoading ? <SkeletonList rows={3} /> : <List title="" items={data?.topNegative ?? []} />}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">All Headlines</h3>
          {isLoading ? <SkeletonList rows={8} /> : (
          <ul className="space-y-2">
            {(data?.articles ?? []).map((a) => {
              const s = a.sentiment;
              const badge =
                !s ? "bg-gray-700" :
                s.label === "positive" ? "bg-green-700" :
                s.label === "negative" ? "bg-red-700" : "bg-yellow-700";

              return (
                <li key={a.url} className="rounded-xl border border-neutral-800 p-3 flex items-start gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${badge}`}>
                    {s ? `${s.label} (${s.score.toFixed(2)})` : a.error ? "error" : "pending"}
                  </span>
                  <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs opacity-70">{a.source} • {new Date(a.publishedAt).toLocaleString()}</div>
                  </a>
                </li>
              );
            })}
          </ul>
          )}
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

function List({ title, items }: { title: string; items: Array<{ title: string; url: string; source: string; publishedAt: string; sentiment: { label: string; score: number } }> }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.url} className="rounded-xl border border-neutral-800 p-3">
            <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs opacity-70">
                {a.source} • {new Date(a.publishedAt).toLocaleString()} • {a.sentiment.label} ({a.sentiment.score.toFixed(2)})
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}