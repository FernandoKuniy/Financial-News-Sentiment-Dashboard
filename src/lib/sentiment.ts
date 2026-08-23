import type { AnalyzeSummary, AnalyzeSummaryShort, SentimentLabel } from "@/types/sentiment";

/** Badge styling for a headline's label. Amber is deliberately absent: neutral is not a warning. */
export function sentimentColor(label: SentimentLabel) {
  switch (label) {
    case "positive":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300";
    case "negative":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";
  }
}

export function formatScore(score: number) {
  return Number.isFinite(score) ? score.toFixed(2) : "0.00";
}

/** Signed, so a reader can tell +0.18 from -0.18 at a glance in a sentence. */
export function formatSignedScore(score: number) {
  if (!Number.isFinite(score)) return "0.00";
  return `${score > 0 ? "+" : ""}${score.toFixed(2)}`;
}

const isShort = (s: AnalyzeSummary): s is AnalyzeSummaryShort => "pos" in s;

export type NormalizedSummary = {
  pos: number;
  neu: number;
  neg: number;
  score: number;
  total: number;
  posPct: number;
  neuPct: number;
  negPct: number;
};

/**
 * The API has shipped two shapes for the summary over its life: `pos/neu/neg` and
 * `positive/neutral/negative`. Both are still in the response type, so every consumer used to
 * unpack them itself. Doing it once here is what stops the pie and the summary card from
 * disagreeing about the same numbers.
 */
export function normalizeSummary(s: AnalyzeSummary): NormalizedSummary {
  const pos = isShort(s) ? s.pos : s.positive;
  const neu = isShort(s) ? s.neu : s.neutral;
  const neg = isShort(s) ? s.neg : s.negative;

  const counts = [pos, neu, neg].map((n) => (Number.isFinite(n) ? n : 0));
  const total = counts[0] + counts[1] + counts[2];

  // The API sends *_pct as 0..1 when it sends them at all. Fall back to the counts so a
  // response missing them still renders the same percentages.
  const pct = (given: number | undefined, count: number) =>
    typeof given === "number" ? given * 100 : total ? (count / total) * 100 : 0;

  return {
    pos: counts[0],
    neu: counts[1],
    neg: counts[2],
    score: Number.isFinite(s.score) ? s.score : 0,
    total,
    posPct: pct(s.pos_pct, counts[0]),
    neuPct: pct(s.neu_pct, counts[1]),
    negPct: pct(s.neg_pct, counts[2]),
  };
}

/**
 * The score in words. A number between -1 and +1 means nothing on its own, and the rule across
 * this app is that a coloured figure never appears without a plain reading of it beside it.
 *
 * The bands are wide on purpose. FinBERT scores most financial headlines close to neutral, so
 * a narrow band around zero would call almost every result "leaning" something.
 */
export function describeScore(score: number): { verdict: string; tone: "up" | "down" | "flat" } {
  if (score >= 0.35) return { verdict: "Clearly positive", tone: "up" };
  if (score >= 0.12) return { verdict: "Leaning positive", tone: "up" };
  if (score > -0.12) return { verdict: "Mostly neutral", tone: "flat" };
  if (score > -0.35) return { verdict: "Leaning negative", tone: "down" };
  return { verdict: "Clearly negative", tone: "down" };
}

export function toneClass(tone: "up" | "down" | "flat") {
  if (tone === "up") return "text-green-600 dark:text-green-500";
  if (tone === "down") return "text-red-600 dark:text-red-500";
  return "text-zinc-600 dark:text-zinc-400";
}
