"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { jsonFetcher } from "@/lib/fetcher";
import type { AnalyzeResponse } from "@/types/sentiment";
import SearchBar from "@/components/search-bar";
import { SummaryCards, SummaryHelp } from "@/components/summary-cards";
import HeadlinesList from "@/components/headlines-list";
import SentimentPie from "@/components/sentiment-pie";
import { LoadingState, ErrorState } from "@/components/state";
import { useEffect, useState } from "react";
import type { PriceResponse } from "@/types/price";
import PriceMiniChart from "@/components/price-mini-chart";

export default function PageClient() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, error, isLoading, mutate } = useSWR<AnalyzeResponse>(
    q ? `/api/analyze?q=${encodeURIComponent(q)}` : null,
    jsonFetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 120000, // 2 minutes
    }
  );

  const looksLikeTicker = (s: string) => /^[A-Z.\-]{1,6}$/.test(s);
  const range = "7d";
  const { data: price } = useSWR<PriceResponse>(
    q && looksLikeTicker(q) ? `/api/price?q=${encodeURIComponent(q)}&range=${range}` : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  function LastUpdated() {
    const [time, setTime] = useState<string | null>(null);
  
    useEffect(() => {
      setTime(new Date().toLocaleTimeString());
    }, []);
  
    if (!time) return null; // render nothing until mounted
  
    return (
      <div className="text-xs text-slate-500">
        Last updated: {time}
      </div>
    );
  }
  

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Financial News Sentiment</h1>

      <SearchBar />

      {!q && <p className="text-sm text-slate-600">Enter a ticker or topic to analyze recent headlines.</p>}

      {q && (
        <section aria-live="polite" className="space-y-3">
          {isLoading && <LoadingState />}
          {error && (
            <ErrorState
              message={error.message || "Unexpected error"}
              onRetry={() => mutate()}
              query={q}
            />
          )}
          {data && !error && !isLoading && (
            <>
              <SummaryCards s={data.summary} />
              <SummaryHelp />
              <LastUpdated />
              <SentimentPie s={data.summary} />
              {price?.items?.length ? (
                <section aria-label="Price (last 7d)">
                  <PriceMiniChart items={price.items} />
                </section>
              ) : null}
              <HeadlinesList items={data.articles} />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="text-xs underline text-slate-600 hover:text-slate-900"
                  aria-label="Refresh results"
                >
                  Refresh
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
