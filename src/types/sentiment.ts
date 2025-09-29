export type SentimentLabel = "positive" | "neutral" | "negative";

export type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  sentiment: { label: SentimentLabel; score: number };
};

export type AnalyzeResponse = {
  articles: Article[];
  summary: AnalyzeSummary;
};

// src/types/sentiment.ts
export type AnalyzeSummaryShort = {
    pos: number; neu: number; neg: number; score: number;
    pos_pct?: number; neu_pct?: number; neg_pct?: number;
};
  
export type AnalyzeSummaryCounts = {
    positive: number; neutral: number; negative: number; score: number;
    pos_pct?: number; neu_pct?: number; neg_pct?: number;
};
  
export type AnalyzeSummary = AnalyzeSummaryShort | AnalyzeSummaryCounts;
  
