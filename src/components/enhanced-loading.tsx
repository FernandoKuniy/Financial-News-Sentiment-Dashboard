"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * The waiting state, shaped like the result that is coming.
 *
 * What was here before invented its progress: a bar that crept toward 85% on a timer, and four
 * named stages that advanced every three seconds whether or not the pipeline had reached them.
 * None of it was wired to the request. The analysis fans out over several days of headlines and
 * takes as long as it takes, and there is no honest percentage to show, so this shows none.
 *
 * The skeletons match the real layout, which is the one thing a loading state can truthfully
 * say: here is where the summary will be, here is the chart, here are the headlines.
 */
export function EnhancedLoading({ query }: { query?: string }) {
  return (
    <div aria-live="polite" aria-busy="true" className="space-y-4">
      <p className="text-sm text-zinc-500">
        {query ? `Scoring recent headlines for ${query}…` : "Scoring recent headlines…"}
      </p>

      <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {["positive", "neutral", "negative"].map((k) => (
            <div key={k}>
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-1.5 h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex h-56 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Skeleton className="size-32 rounded-full" />
        </div>
        <div className="flex h-56 items-end gap-2 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-900"
          >
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
