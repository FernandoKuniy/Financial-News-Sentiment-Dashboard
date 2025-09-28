"use client";

import useSWR from "swr";

export type SentOK = { label: "positive" | "neutral" | "negative"; score: number };
export type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: SentOK;
  error?: string;
};
export type Summary = {
  positive: number; neutral: number; negative: number;
  pos_pct: number; neu_pct: number; neg_pct: number;
  score: number;
};
export type AnalyzeResponse = {
  q: string;
  count: number;
  articles: Article[];
  summary: Summary;
  topPositive: Array<Article & { sentiment: SentOK }>;
  topNegative: Array<Article & { sentiment: SentOK }>;
};

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Analyze failed: ${r.status}`);
  return r.json() as Promise<AnalyzeResponse>;
});

export function useAnalyze(q: string | null, limit = 25) {
  const key = q ? `/api/analyze?q=${encodeURIComponent(q)}&limit=${limit}` : null;
  const { data, error, isLoading, mutate } = useSWR<AnalyzeResponse>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { data, error, isLoading, refresh: () => mutate() };
}
