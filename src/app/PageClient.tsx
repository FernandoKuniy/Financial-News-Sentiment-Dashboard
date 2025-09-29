"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { jsonFetcher } from "@/lib/fetcher";
import type { AnalyzeResponse } from "@/types/sentiment";
import SearchBar from "@/components/search-bar";
import { SummaryCards, SummaryHelp } from "@/components/summary-cards";
import HeadlinesList from "@/components/headlines-list";
import { LoadingState, ErrorState } from "@/components/state";

export default function PageClient() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, error, isLoading, mutate } = useSWR<AnalyzeResponse>(
    q ? `/api/analyze?q=${encodeURIComponent(q)}` : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );

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
