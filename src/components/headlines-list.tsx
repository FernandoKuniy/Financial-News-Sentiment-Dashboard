"use client";

import { ExternalLink } from "lucide-react";

import type { Article } from "@/types/sentiment";
import { sentimentColor, formatSignedScore } from "@/lib/sentiment";
import { Badge } from "@/components/ui/badge";

function timeAgo(iso: string) {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return null;
  const mins = Math.max(1, Math.round((Date.now() - parsed) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * Every headline that went into the score, so the number above is checkable.
 *
 * Titles wrap rather than truncate. A clipped headline is worse than a tall row here: the whole
 * point of the list is being able to read what the model read.
 */
export default function HeadlinesList({ items }: { items: Article[] }) {
  if (!items.length) {
    return (
      <p
        role="status"
        className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700"
      >
        No headlines came back for this search.
      </p>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium">
        Headlines <span className="font-normal text-zinc-500">({items.length})</span>
      </h2>
      <ul className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {items.map((a, i) => {
          const label = a.sentiment?.label;
          const score = a.sentiment?.score ?? 0;
          const when = timeAgo(a.publishedAt);

          return (
            <li
              key={`${a.url}-${i}`}
              className="border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-sm font-medium hover:underline"
                >
                  {a.title}
                </a>
                {label ? (
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${sentimentColor(label)}`}
                    title={`FinBERT scored this ${label}, confidence ${formatSignedScore(score)}`}
                  >
                    {label}
                  </Badge>
                ) : (
                  <span className="shrink-0 text-xs text-zinc-400">not scored</span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                {/* A source name can be long, so it takes the squeeze rather than the date. */}
                <span className="truncate" title={a.source}>
                  {a.source}
                </span>
                {when && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={a.publishedAt} className="shrink-0 tabular-nums">
                      {when}
                    </time>
                  </>
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto shrink-0 hover:text-zinc-900 dark:hover:text-zinc-100"
                  aria-label={`Open "${a.title}" in a new tab`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
