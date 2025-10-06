import { NextRequest } from "next/server";
import { z } from "zod";
import { getJSON } from "@/lib/http";
import { cacheGet, cacheSet } from "@/lib/cache";
import { createTokenBucket } from "@/lib/limiter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NewsApiArticleSchema = z.object({
  source: z.object({ id: z.string().nullable().optional(), name: z.string().default("Unknown") }).default({ name: "Unknown" }),
  author: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().url(),
  publishedAt: z.string().min(1),
});
const NewsApiResponseSchema = z.object({
  status: z.string(),
  articles: z.array(NewsApiArticleSchema).default([]),
});

// --- Rate gate (module-level state; best-effort per instance) ---
const takeNewsToken = createTokenBucket(1, 1000); // ~1 req/sec
let dayCount = 0;
let dayStart = Date.now();
const MAX_DAILY = 90; // safety margin under free 100/day

function allowDaily() {
  const now = Date.now();
  if (now - dayStart >= 24 * 60 * 60 * 1000) { dayStart = now; dayCount = 0; }
  return dayCount < MAX_DAILY;
}
function countDaily() {
  const now = Date.now();
  if (now - dayStart >= 24 * 60 * 60 * 1000) { dayStart = now; dayCount = 0; }
  dayCount += 1;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const fromISO = searchParams.get("from");
    const toISO = searchParams.get("to");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Math.min(Number(searchParams.get("pageSize") || 100), 100);
    const legacyLimit = Number(searchParams.get("limit") || 25);

    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
    if (!process.env.NEWSAPI_KEY) return Response.json({ error: "Server missing NEWSAPI_KEY" }, { status: 500 });

    const key = fromISO && toISO
      ? `news:${q}:from=${fromISO}:to=${toISO}:page=${page}:size=${pageSize}`
      : `news:${q}:recent:limit=${Math.min(legacyLimit, 50)}`;

    // Serve cached if present
    const cached = cacheGet<{ q: string; count: number; items: { title: string; url: string; source: string; publishedAt: string }[] }>(key);
    if (cached) return Response.json(cached, { headers: { "x-cache": "HIT" } });

    // Rate gate: daily + ~1 rps. If blocked, try serve stale cache (already checked) → 429.
    if (!allowDaily() || !takeNewsToken()) {
      return Response.json({ error: "News API rate limited" }, { status: 429 });
    }

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");

    if (fromISO && toISO) {
      url.searchParams.set("from", fromISO);
      url.searchParams.set("to", toISO);
      url.searchParams.set("page", String(Math.max(1, page)));
      url.searchParams.set("pageSize", String(pageSize));
      if (!searchParams.get("searchIn")) url.searchParams.set("searchIn", "title,description");
    } else {
      url.searchParams.set("pageSize", String(Math.min(legacyLimit, 50)));
    }

    const raw = await getJSON<unknown>(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.NEWSAPI_KEY}` },
    });

    countDaily(); // only count on successful upstream call

    const parsed = NewsApiResponseSchema.safeParse(raw);
    if (!parsed.success) {
      const payload = { q, count: 0, items: [], warning: "Upstream payload invalid" };
      cacheSet(key, payload, 10 * 60_000);
      return Response.json(payload);
    }

    const items = parsed.data.articles.map(a => ({
      title: a.title,
      url: a.url,
      source: a.source.name || "Unknown",
      publishedAt: a.publishedAt,
    }));
    const payload = { q, count: items.length, items };

    // Cache day-window longer than recent queries
    const ttl = fromISO && toISO ? 20 * 60_000 : 5 * 60_000;
    cacheSet(key, payload, ttl);

    return Response.json({ q, count: items.length, items });
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "error");
    const status = /HTTP 429/.test(msg) ? 429 : 500;
    return Response.json({ error: msg }, { status });
  }
}