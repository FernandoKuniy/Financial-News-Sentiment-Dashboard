"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";

import { jsonFetcher } from "@/lib/fetcher";
import type { AnalyzeResponse } from "@/types/sentiment";
import type { PriceResponse } from "@/types/price";
import SearchBar from "@/components/search-bar";
import { SummaryCards, SummaryHelp } from "@/components/summary-cards";
import HeadlinesList from "@/components/headlines-list";
import SentimentPie from "@/components/sentiment-pie";
import SentimentPriceChart from "@/components/sentiment-price-chart";
import { ErrorState } from "@/components/state";
import { EnhancedLoading } from "@/components/enhanced-loading";

const REFRESH_MS = 120_000;

// Alpha Vantage only has prices for a symbol, so a topic search skips that request entirely
// rather than spending one of the 25 daily calls on "AI chips". Case-insensitive: someone
// typing "aapl" means the same ticker as "AAPL", and the uppercase-only test used to send them
// down the no-price path.
const looksLikeTicker = (s: string) => /^[A-Za-z.\-]{1,6}$/.test(s);

export default function PageClient() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, error, isLoading, mutate } = useSWR<AnalyzeResponse>(
    q ? `/api/analyze?q=${encodeURIComponent(q)}` : null,
    jsonFetcher,
    { revalidateOnFocus: false, refreshInterval: REFRESH_MS },
  );

  const { data: price } = useSWR<PriceResponse>(
    q && looksLikeTicker(q) ? `/api/price?q=${encodeURIComponent(q)}&range=7d` : null,
    jsonFetcher,
    { revalidateOnFocus: false },
  );

  // When this data actually landed. The old version stamped the time the component mounted and
  // never moved it again, so after an auto-refresh it was reporting the wrong thing. This is an
  // event, not something derivable at render, which is why it lives in state.
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  useEffect(() => {
    if (data) setFetchedAt(Date.now());
  }, [data]);

  const showResults = Boolean(data) && !error && !isLoading;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">How did the news read?</h1>

      <div className="mt-4 max-w-xl">
        <SearchBar />
      </div>

      {/* The instructions disappear once you have searched. You know how it works by then. */}
      {!q && (
        <p className="mt-3 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
          Type a ticker like AAPL, or a topic like AI chips. FinBERT reads the last week of
          headlines and scores each one positive, neutral or negative.
        </p>
      )}

      {q && (
        <section aria-live="polite" className="mt-8 space-y-4">
          {isLoading && <EnhancedLoading query={q} />}

          {error && (
            <ErrorState
              message={error instanceof Error ? error.message : "Unexpected error"}
              onRetry={() => mutate()}
              query={q}
            />
          )}

          {showResults && data && (
            <>
              {data.articles.length === 0 ? (
                /* Nothing came back at all. Each section below can say so on its own, but four
                   dashed boxes reporting the same absence reads worse than one sentence. */
                <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No headlines came back for{" "}
                    <span className="font-medium break-words text-zinc-900 dark:text-zinc-100">
                      {q}
                    </span>
                    .
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Try a ticker symbol like AAPL, or a broader topic like semiconductors.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-3 md:col-span-2">
                      <SummaryCards s={data.summary} query={q} />
                      <SummaryHelp />
                    </div>
                    <SentimentPie s={data.summary} />
                  </div>

                  <SentimentPriceChart articles={data.articles} prices={price?.items ?? []} />

                  <HeadlinesList items={data.articles} />
                </>
              )}

              {/* Outside the branch above: an empty result is the case where you most want to
                  try again. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-zinc-500">
                <LastUpdated at={fetchedAt} />
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="rounded-md underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Refresh now
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function LastUpdated({ at }: { at: number | null }) {
  // Null on the server and on the first client render, so the clock never causes a hydration
  // mismatch by disagreeing with itself.
  if (!at) return null;
  const stamp = new Date(at);
  return (
    <p>
      Updated{" "}
      <time dateTime={stamp.toISOString()} className="tabular-nums">
        {stamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </time>
      , then every two minutes.
    </p>
  );
}
