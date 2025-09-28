import { NextRequest } from "next/server";
import { z } from "zod";
import { SentErr, SentItem, SentOK } from "@/lib/finbert";
import { getJSON } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NewsItem = { title: string; url: string; source: string; publishedAt: string };

const QuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).default(25),
});

function dedupeByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    if (!seen.has(it.url)) {
      seen.add(it.url);
      out.push(it);
    }
  }
  return out;
}

function summarize(sent: SentItem[]) {
  let pos = 0, neu = 0, neg = 0, okN = 0, weighted = 0;

  const ok = sent.filter((s): s is SentOK => "label" in s && "score" in s);
  for (const s of ok) {
    if (s.label === "positive") { pos++; weighted += 1 * s.score; okN++; }
    else if (s.label === "negative") { neg++; weighted += -1 * s.score; okN++; }
    else { neu++; /* weight 0 for neutral */ okN++; }
  }

  const total = ok.length; // only successfully classified items
  const pct = (n: number) => (total ? n / total : 0);
  const score = okN ? Math.max(-1, Math.min(1, weighted / okN)) : 0;

  return {
    positive: pos, neutral: neu, negative: neg,
    pos_pct: pct(pos), neu_pct: pct(neu), neg_pct: pct(neg),
    score,
  };
}

function topN(
    arts: Array<NewsItem & { sentiment?: SentOK }>,
    label: "positive" | "negative",
    n = 5
  ) {
    return arts
      .filter(a => a.sentiment && a.sentiment.label === label)
      .sort((a, b) => b.sentiment!.score - a.sentiment!.score)
      .slice(0, n)
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        sentiment: { label: a.sentiment!.label, score: a.sentiment!.score },
      }));
  }
  

export async function GET(req: NextRequest) {
  try {
    const params = QuerySchema.safeParse({
      q: req.nextUrl.searchParams.get("q"),
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!params.success) return Response.json({ error: "Missing or invalid query" }, { status: 400 });

    const { q, limit } = params.data;
    const origin = req.nextUrl.origin;

    // 1) fetch news (reuse existing /api/news normalization)
    const newsRes = await getJSON<{ items: NewsItem[] }>(
      `${origin}/api/news?q=${encodeURIComponent(q)}&limit=${limit}`
    );
    const deduped = dedupeByUrl(newsRes.items ?? []);
    const headlines = deduped.map(a => a.title);

    // If no headlines, return empty summary
    if (headlines.length === 0) {
      return Response.json({
        q, count: 0, articles: [],
        summary: { positive: 0, neutral: 0, negative: 0, pos_pct: 0, neu_pct: 0, neg_pct: 0, score: 0 },
        topPositive: [], topNegative: []
      });
    }

    // 2) run sentiment (reuse existing /api/sentiment)
    const sentRes = await fetch(`${origin}/api/sentiment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ headlines }),
    });

    if (!sentRes.ok) {
      const txt = await sentRes.text();
      return Response.json({ error: `sentiment failed: ${txt}` }, { status: 502 });
    }
    const { items: sentiment } = (await sentRes.json()) as { items: SentItem[] };

    // 3) join articles + sentiments by index
    const articles = deduped.map((a, i) => {
      const s = sentiment[i];
      const sentimentOK = s && "label" in s && "score" in s ? (s as SentOK) : undefined;
      return { ...a, sentiment: sentimentOK ?? undefined, error: ("error" in (s ?? {}) ? (s as unknown as SentErr).error : undefined) };
    });

    // 4) aggregate + top lists
    const summary = summarize(sentiment);
    const topPositive = topN(articles, "positive", 5);
    const topNegative = topN(articles, "negative", 5);

    return Response.json({
      q,
      count: articles.length,
      articles,
      summary,
      topPositive,
      topNegative,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
