import { NextRequest } from "next/server";
import { z } from "zod";
import { getJSON } from "@/lib/http";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    // New optional params for day-windowed queries + pagination
    const fromISO = searchParams.get("from");
    const toISO = searchParams.get("to");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Math.min(Number(searchParams.get("pageSize") || 100), 100);

    // Legacy param (recent-only)
    const legacyLimit = Number(searchParams.get("limit") || 25);

    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
    if (!process.env.NEWSAPI_KEY) return Response.json({ error: "Server missing NEWSAPI_KEY" }, { status: 500 });

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");

    // If a day window is provided, use from/to + pagination; else fall back to legacy limit
    if (fromISO && toISO) {
      url.searchParams.set("from", fromISO);
      url.searchParams.set("to", toISO);
      url.searchParams.set("page", String(Math.max(1, page)));
      url.searchParams.set("pageSize", String(pageSize));
      // Improve recall for day windows unless caller overrides
      if (!searchParams.get("searchIn")) url.searchParams.set("searchIn", "title,description");
    } else {
      url.searchParams.set("pageSize", String(Math.min(legacyLimit, 50)));
    }

    const raw = await getJSON<unknown>(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.NEWSAPI_KEY}` },
    });

    const parsed = NewsApiResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ q, count: 0, items: [], warning: "Upstream payload invalid" });
    }

    const items = parsed.data.articles.map(a => ({
      title: a.title,
      url: a.url,
      source: a.source.name || "Unknown",
      publishedAt: a.publishedAt,
    }));

    return Response.json({ q, count: items.length, items });
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "error");
    const status = /HTTP 429/.test(msg) ? 429 : 500;
    return Response.json({ error: msg }, { status });
  }
}