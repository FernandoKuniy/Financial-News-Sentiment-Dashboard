import { NextRequest } from "next/server";
import { getJSON } from "@/lib/http";

export const dynamic = "force-dynamic"; // disable static caching
export const runtime = "nodejs";

type NewsApiArticle = {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");           // ticker or topic
    const pageSize = Number(searchParams.get("limit") || 25);

    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
    if (!process.env.NEWSAPI_KEY) {
      return Response.json({ error: "Server missing NEWSAPI_KEY" }, { status: 500 });
    }

    // NewsAPI query: restrict to business/finance is done via domains or category on /top-headlines
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", q);
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", String(Math.min(pageSize, 50)));
    url.searchParams.set("sortBy", "publishedAt");

    const data = await getJSON<{ status: string; articles: NewsApiArticle[] }>(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.NEWSAPI_KEY}` },
    });

    // Normalize
    const items = (data.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));

    return Response.json({ q, count: items.length, items });
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
