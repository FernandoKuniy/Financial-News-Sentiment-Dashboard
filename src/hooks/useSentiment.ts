"use client";

import useSWR from "swr";

export type SentimentOK = {
  label: "positive" | "neutral" | "negative";
  score: number;
};
export type SentimentErr = { error: string };
export type SentimentItem = SentimentOK | SentimentErr;

export interface SentimentResponse {
  count: number;
  items: SentimentItem[];
}

const postJSON = async (url: string, body: unknown) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as SentimentResponse;
};

export function useSentiment(headlines: string[] | null) {
  const key = headlines && headlines.length > 0 ? ["/api/sentiment", ...headlines] : null;
  const { data, error, isLoading, mutate } = useSWR<SentimentResponse>(
    key,
    () => postJSON("/api/sentiment", { headlines }),
    { revalidateOnFocus: false }
  );
  return { data, error, isLoading, refresh: () => mutate() };
}
