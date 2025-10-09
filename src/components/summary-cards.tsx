"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AnalyzeSummary, AnalyzeSummaryShort } from "@/types/sentiment";
import { Gauge, Info } from "lucide-react";
import { formatScore } from "@/lib/sentiment";

const isShort = (s: AnalyzeSummary): s is AnalyzeSummaryShort => "pos" in s;

type Normalized = {
  pos: number; neu: number; neg: number; score: number;
  posPct?: number; neuPct?: number; negPct?: number;
  total: number;
};

function normalizeSummary(s: AnalyzeSummary): Normalized {
  const pos = isShort(s) ? s.pos : s.positive;
  const neu = isShort(s) ? s.neu : s.neutral;
  const neg = isShort(s) ? s.neg : s.negative;

  // API may provide *_pct in 0..1 range
  const posPct = typeof s.pos_pct === "number" ? s.pos_pct * 100 : undefined;
  const neuPct = typeof s.neu_pct === "number" ? s.neu_pct * 100 : undefined;
  const negPct = typeof s.neg_pct === "number" ? s.neg_pct * 100 : undefined;

  const score = s.score;
  const total = [pos, neu, neg].every(Number.isFinite) ? pos + neu + neg : 0;

  return { pos, neu, neg, score, posPct, neuPct, negPct, total };
}

export function SummaryCards({ s }: { s: AnalyzeSummary }) {
  const n = normalizeSummary(s);

  const posPct = n.posPct ?? (n.total ? (n.pos / n.total) * 100 : 0);
  const neuPct = n.neuPct ?? (n.total ? (n.neu / n.total) * 100 : 0);
  const negPct = n.negPct ?? (n.total ? (n.neg / n.total) * 100 : 0);

  const pct = (v: number) => `${Math.round(v)}%`;
  const score = formatScore(n.score);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-green-400">Positive</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-100">{pct(posPct)}</CardContent>
      </Card>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-300">Neutral</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-100">{pct(neuPct)}</CardContent>
      </Card>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">Negative</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-100">{pct(negPct)}</CardContent>
      </Card>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 flex flex-row items-center gap-2"><Gauge className="h-4 w-4 text-slate-300" /><CardTitle className="text-sm text-slate-300">Avg score</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold text-slate-100">{score}</CardContent>
      </Card>
    </div>
  );
}

export function SummaryHelp() {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Info className="h-3.5 w-3.5" />
      <span>Score ∈ [−1, 1]. Higher is more positive.</span>
    </div>
  );
}
