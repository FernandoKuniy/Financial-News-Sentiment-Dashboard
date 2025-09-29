"use client";

import type { Article } from "@/types/sentiment";
import { sentimentColor, formatScore } from "@/lib/sentiment";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function HeadlinesList({ items }: { items: Article[] }) {
  if (!items.length) {
    return (
      <p role="status" className="text-sm text-slate-600">
        No articles found.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((a, i) => (
        <li key={a.url + i} className="p-4 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 hover:text-black focus:text-black hover:underline focus:underline focus:outline-none"
            >
              {a.title}
            </a>
            <Badge
              className={`border ${sentimentColor(a.sentiment.label)} shrink-0`}
              aria-label={`Sentiment ${a.sentiment.label} score ${formatScore(a.sentiment.score)}`}
            >
              {a.sentiment.label}
            </Badge>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>{a.source}</span>
            <span>•</span>
            <span>{timeAgo(a.publishedAt)}</span>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-auto text-slate-600 hover:text-slate-900"
              aria-label="Open article"
              title="Open article"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
