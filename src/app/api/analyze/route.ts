import { NextRequest } from "next/server";
import { z } from "zod";
import { SentErr, SentItem, SentOK } from "@/lib/finbert";
import { getJSON } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NewsItem = { title: string; url: string; source: string; publishedAt: string };
type PricePoint = { date: string; close: number };
type PriceRes = { q: string; range: "7d" | "14d" | "30d"; items: PricePoint[] };
type DayAgg = { date: string; value: number; articleCount: number };

const QuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).default(25), // legacy
  range: z.enum(["7d", "14d", "30d"]).default("7d"),
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
    else { neu++; okN++; }
  }
  const total = ok.length;
  const pct = (n: number) => (total ? n / total : 0);
  const score = okN ? Math.max(-1, Math.min(1, weighted / okN)) : 0;
  return { positive: pos, neutral: neu, negative: neg, pos_pct: pct(pos), neu_pct: pct(neu), neg_pct: pct(neg), score };
}

function signedScore(label: string, score: number) {
  if (label === "positive") return +Math.max(0, Math.min(1, score));
  if (label === "negative") return -Math.max(0, Math.min(1, score));
  return 0;
}

function rolling3(values: number[]): number[] {
  const out: number[] = [];
  const buf: number[] = [];
  let sum = 0;
  for (const v of values) {
    buf.push(v);
    sum += v;
    if (buf.length > 3) sum -= buf.shift()!;
    out.push(sum / buf.length);
  }
  return out;
}

// For now treat ET as EDT (UTC+4). If you need DST-accurate later, switch to a TZ lib.
function etDayWindowToUtc(dateISO: string) {
  // dateISO is YYYY-MM-DD (price/trading date)
  const from = `${dateISO}T04:00:00Z`;
  // to is next day 03:59:59Z
  const d = new Date(`${dateISO}T00:00:00Z`);
  const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(next.getUTCDate()).padStart(2, "0");
  const to = `${yyyy}-${mm}-${dd}T03:59:59Z`;
  return { from, to };
}

async function fetchNewsForDay(origin: string, q: string, fromISO: string, toISO: string, targetPerDay = 20, maxPages = 3) {
  let items: NewsItem[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const u = new URL(`${origin}/api/news`);
    u.searchParams.set("q", q);
    u.searchParams.set("from", fromISO);
    u.searchParams.set("to", toISO);
    u.searchParams.set("pageSize", "100");
    u.searchParams.set("page", String(page));
    const res = await getJSON<{ items: NewsItem[] }>(u.toString());
    const batch = res.items || [];
    items = dedupeByUrl(items.concat(batch));
    if (batch.length < 100 || items.length >= targetPerDay) break;
  }
  return items;
}

function aggregatePerDay(datesAsc: string[], perDayArticles: Map<string, (NewsItem & { sentiment?: SentOK })[]>) {
  const daily: DayAgg[] = [];
  for (const date of datesAsc) {
    const arts = perDayArticles.get(date) || [];
    let sum = 0, n = 0;
    for (const a of arts) {
      const s = a.sentiment;
      if (!s) continue;
      sum += signedScore(s.label, s.score);
      n++;
    }
    const value = n ? Math.max(-1, Math.min(1, sum / n)) : 0;
    daily.push({ date, value, articleCount: arts.length });
  }
  return daily;
}

async function classifyChunk(origin: string, chunk: string[]) {
  const res = await fetch(`${origin}/api/sentiment`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ headlines: chunk }),
  });
  if (!res.ok) throw new Error(`sentiment failed: ${await res.text().catch(()=> "")}`);

  const json = (await res.json()) as { items: SentItem[] };
  const items = json.items || [];
  if (items.length !== chunk.length) {
    return Array.from({ length: chunk.length }, (_, i) => items[i] ?? ({ error: "missing" } as SentErr));
  }
  return items;
}

// classify all headlines in chunks of ≤64, preserving order
async function classifyAll(origin: string, headlines: string[], chunkSize = 64) {
  const out: SentItem[] = [];
  for (let i = 0; i < headlines.length; i += chunkSize) {
    const chunk = headlines.slice(i, i + chunkSize);
    const items = await classifyChunk(origin, chunk);
    out.push(...items);
  }
  return out;
}


export async function GET(req: NextRequest) {
  try {
    const params = QuerySchema.safeParse({
      q: req.nextUrl.searchParams.get("q"),
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
      range: (req.nextUrl.searchParams.get("range") as "7d" | "14d" | "30d") ?? undefined,
    });
    if (!params.success) return Response.json({ error: "Missing or invalid query" }, { status: 400 });

    const { q, range } = params.data;
    const origin = req.nextUrl.origin;

    // 0) Get price dates (canonical x-axis)
    const priceRes = await getJSON<PriceRes>(`${origin}/api/price?q=${encodeURIComponent(q)}&range=${range}`);
    const priceSeries = priceRes.items || [];
    const datesAsc = priceSeries.map(p => p.date); // sorted asc by /api/price

    // Fallback: legacy recent-mode if no price data
    if (!datesAsc.length) {
      const newsRes = await getJSON<{ items: NewsItem[] }>(`${origin}/api/news?q=${encodeURIComponent(q)}&limit=25`);
      const deduped = dedupeByUrl(newsRes.items ?? []);
      const headlines = deduped.map(a => a.title);
    
      // classify (chunked)
      let sentiment: SentItem[] = [];
      if (headlines.length) {
        sentiment = await classifyAll(origin, headlines, 64);
        if (sentiment.length !== headlines.length) {
          console.warn("analyze: sentiment misalignment", { in: headlines.length, out: sentiment.length });
        }
      }
    
      // If no headlines, return empty summary early
      if (!headlines.length) {
        return Response.json({
          q, count: 0, articles: [],
          summary: { positive: 0, neutral: 0, negative: 0, pos_pct: 0, neu_pct: 0, neg_pct: 0, score: 0 },
          topPositive: [], topNegative: [],
          priceSeries: [], sentimentDaily: [], sentiment3d: []
        });
      }
    
      // join
      const articles = deduped.map((a, i) => {
        const s = sentiment[i];
        const ok = s && "label" in s && "score" in s ? (s as SentOK) : undefined;
        return { ...a, sentiment: ok ?? undefined, error: ("error" in (s ?? {}) ? (s as unknown as SentErr).error : undefined) };
      });
    
      const okOnly = (sentiment || []).filter((s): s is SentOK => s && "label" in s && "score" in s);
      const summary = summarize(okOnly);
      const topPositive = articles.filter(a => a.sentiment?.label === "positive").sort((a, b) => b.sentiment!.score - a.sentiment!.score).slice(0, 5);
      const topNegative = articles.filter(a => a.sentiment?.label === "negative").sort((a, b) => b.sentiment!.score - a.sentiment!.score).slice(0, 5);
    
      return Response.json({
        q, count: articles.length, articles, summary, topPositive, topNegative,
        priceSeries: [], sentimentDaily: [], sentiment3d: []
      });
    }

    // 1) Day-windowed fetch across trading days (respect a simple global budget)
    const perDay = new Map<string, NewsItem[]>();
    let calls = 0;
    const MAX_CALLS = 25; // ~7 days * up to 3 pages/day (just a conservative cap)

    for (const date of datesAsc) {
      if (calls >= MAX_CALLS) break;
      const { from, to } = etDayWindowToUtc(date);
      const items = await fetchNewsForDay(origin, q, from, to, 20, 3);
      // Rough accounting: count at least one call per day; paging adds more
      calls += Math.max(1, Math.ceil(items.length / 100));
      perDay.set(date, dedupeByUrl(items));
    }

    // 2) Classify all headlines in stable order and reattach per day
    const flatArticles: (NewsItem & { __date: string })[] = [];
    for (const d of datesAsc) {
      const arr = perDay.get(d) || [];
      for (const a of arr) flatArticles.push({ ...a, __date: d });
    }

    const headlines = flatArticles.map(a => a.title);
    let sentiment: SentItem[] = [];
    if (headlines.length) {
      sentiment = await classifyAll(origin, headlines, 64);
      if (sentiment.length !== headlines.length) {
        console.warn("analyze: sentiment misalignment", { in: headlines.length, out: sentiment.length });
      }
    }

    const perDayJoined = new Map<string, (NewsItem & { sentiment?: SentOK })[]>();
    for (let i = 0; i < flatArticles.length; i++) {
      const a = flatArticles[i];
      const s = sentiment[i];
      const ok = s && "label" in s && "score" in s ? (s as SentOK) : undefined;
      const list = perDayJoined.get(a.__date) || [];
      list.push({ title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt, sentiment: ok });
      perDayJoined.set(a.__date, list);
    }

    // 3) Aggregate per day and compute rolling 3-day
    const daily = aggregatePerDay(datesAsc, perDayJoined);
    const sentimentDaily = daily.map(d => ({ date: d.date, value: d.value, articleCount: d.articleCount }));
    const sentiment3dValues = rolling3(sentimentDaily.map(d => d.value));
    const sentiment3d = datesAsc.map((date, i) => ({ date, value: sentiment3dValues[i] }));

    // 4) Flatten overall article list & compute tops for compatibility
    const articles = flatArticles.map((a, i) => {
      const s = sentiment[i];
      const ok = s && "label" in s && "score" in s ? (s as SentOK) : undefined;
      return { title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt, sentiment: ok };
    });

    const okOnly = (sentiment || []).filter((s): s is SentOK => s && "label" in s && "score" in s);
    const summary = summarize(okOnly);
    const topPositive = articles.filter(a => a.sentiment?.label === "positive").sort((a, b) => b.sentiment!.score - a.sentiment!.score).slice(0, 5);
    const topNegative = articles.filter(a => a.sentiment?.label === "negative").sort((a, b) => b.sentiment!.score - a.sentiment!.score).slice(0, 5);

    return Response.json({
      q,
      count: articles.length,
      articles,
      summary,
      topPositive,
      topNegative,
      priceSeries,
      sentimentDaily,
      sentiment3d,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
