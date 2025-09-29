"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { jsonFetcher } from "@/lib/fetcher";
import type { AnalyzeResponse } from "@/types/sentiment";
import SearchBar from "@/components/search-bar";
import { SummaryCards, SummaryHelp } from "@/components/summary-cards";
import HeadlinesList from "@/components/headlines-list";

export default function Page() {
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

      {!q && (
        <p className="text-sm text-slate-600">
          Enter a ticker or topic to analyze recent headlines.
        </p>
      )}

      {q && (
        <>
          <section aria-live="polite" className="space-y-3">
            {isLoading && (
              <div className="animate-pulse">
                <div className="h-24 rounded-2xl bg-slate-100 mb-3" />
                <div className="h-40 rounded-2xl bg-slate-100" />
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Failed to load analysis for “{q}”. {error.message}
              </div>
            )}

            {data && (
              <>
                <SummaryCards s={data.summary} />
                <SummaryHelp />
                <HeadlinesList items={data.articles} />
              </>
            )}
          </section>

          <div className="flex gap-2">
            {data && (
              <button
                type="button"
                onClick={() => mutate()}
                className="text-xs underline text-slate-600 hover:text-slate-900"
                aria-label="Refresh results"
              >
                Refresh
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
