import type { SentimentLabel } from "@/types/sentiment";

export function sentimentColor(label: SentimentLabel) {
  switch (label) {
    case "positive":
      return "bg-green-100 text-green-800 border-green-300";
    case "negative":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

export function formatScore(score: number) {
    return Number.isFinite(score) ? score.toFixed(2) : "0.00";
}

