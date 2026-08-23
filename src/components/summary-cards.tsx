"use client";

import type { AnalyzeSummary } from "@/types/sentiment";
import { describeScore, formatSignedScore, normalizeSummary, toneClass } from "@/lib/sentiment";

/**
 * The answer to the one question this page exists to answer: how did the recent news on this
 * ticker read?
 *
 * It leads with words, not the number. FinBERT's score is a float between -1 and +1, which
 * tells a reader nothing until it has been put into a sentence, so the verdict is the big type
 * and the score appears inside the explanation underneath it.
 *
 * The three counts sit below a rule rather than in four equal cards. An average score is not
 * the same kind of fact as a count of headlines, and giving them identical tiles said they were.
 *
 * The split is not drawn here. SentimentPie already shows it, and two views of one distribution
 * on the same screen is one too many.
 */
export function SummaryCards({ s, query }: { s: AnalyzeSummary; query?: string }) {
  const n = normalizeSummary(s);
  const { verdict, tone } = describeScore(n.score);

  if (n.total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
        No headlines came back for this one, so there is nothing to score yet.
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-sm text-zinc-500">
        {query ? (
          <>
            {/* A topic search can be a long phrase, so it wraps rather than pushing the card
                sideways or getting clipped. */}
            The last {n.total} headlines on{" "}
            <span className="font-medium break-words text-zinc-900 dark:text-zinc-100">
              {query}
            </span>
          </>
        ) : (
          <>The last {n.total} headlines</>
        )}
      </h2>

      <p className={`mt-1 text-4xl font-semibold tracking-tight ${toneClass(tone)}`}>{verdict}</p>

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        That averages out to{" "}
        <span className="font-medium tabular-nums">{formatSignedScore(n.score)}</span>, on a scale
        where +1 would mean every headline read positive and -1 every one negative.
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
        <Count label="positive" value={n.pos} pct={n.posPct} className="text-green-600 dark:text-green-500" />
        <Count label="neutral" value={n.neu} pct={n.neuPct} className="text-zinc-600 dark:text-zinc-400" />
        <Count label="negative" value={n.neg} pct={n.negPct} className="text-red-600 dark:text-red-500" />
      </dl>
    </section>
  );
}

function Count({
  label,
  value,
  pct,
  className,
}: {
  label: string;
  value: number;
  pct: number;
  className: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 font-medium tabular-nums ${className}`}>
        {value} <span className="text-zinc-500">({Math.round(pct)}%)</span>
      </dd>
    </div>
  );
}

/**
 * The detail a first-time reader needs and a returning one does not. Native <details>, so it
 * costs no client JS and stays closed until someone actually wants it.
 */
export function SummaryHelp() {
  return (
    <details className="group text-sm">
      <summary className="w-fit cursor-pointer list-none text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 [&::-webkit-details-marker]:hidden">
        How is this scored?
      </summary>
      <p className="mt-2 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
        Every headline goes through FinBERT, a model trained on financial text, which labels it
        positive, neutral or negative and says how confident it is. Positive headlines count as
        their confidence, negative ones as minus their confidence, neutral ones as zero. The
        average of those is the score. It reflects how reporters wrote, which is not the same as
        what the stock did.
      </p>
    </details>
  );
}
