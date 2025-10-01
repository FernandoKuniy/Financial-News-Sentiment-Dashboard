import { NextRequest } from "next/server";
import { z } from "zod";
import { getJSON } from "@/lib/http";
import { cacheGet, cacheSet } from "@/lib/cache";
import { takeToken } from "@/lib/limiter";
import { singleflight } from "@/lib/singleflight";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().min(1),
  range: z.enum(["7d", "14d", "30d"]).default("7d"),
});

const SeriesSchema = z.record(
  z.string(),
  z.object({
    "4. close": z.string(),
  })
);

const AvDailySchema = z.object({
  "Time Series (Daily)": SeriesSchema,
}).passthrough();

function daysFromRange(r: "7d" | "14d" | "30d") {
  return r === "7d" ? 7 : r === "14d" ? 14 : 30;
}

export async function GET(req: NextRequest) {
  try {
    const params = QuerySchema.safeParse({
      q: req.nextUrl.searchParams.get("q"),
      range: (req.nextUrl.searchParams.get("range") as "7d" | "14d" | "30d") ?? undefined,
    });
    if (!params.success) return Response.json({ error: "Missing or invalid query" }, { status: 400 });

    if (!process.env.ALPHAVANTAGE_KEY) {
      return Response.json({ error: "Server missing ALPHAVANTAGE_KEY" }, { status: 500 });
    }

    const { q, range } = params.data;
    const key = `price:${q}:${range}`;

    // 1. check cache
    const cached = cacheGet<unknown>(key);
    if (cached) {
      return Response.json(cached, { headers: { "x-cache": "HIT" } });
    }

    // 2) collapse concurrent identical requests
    const payload = await singleflight(key, async () => {
      // (optional) token bucket limiter BEFORE hitting Alpha Vantage
      if (!takeToken()) {
        // If over our app-level limit, try to serve stale cache; otherwise bubble up 429
        const stale = cacheGet<unknown>(key);
        if (stale) return stale; // serve stale while limited
        throw new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 });
      }
    
      // Upstream fetch
      const url = new URL("https://www.alphavantage.co/query");
      url.searchParams.set("function", "TIME_SERIES_DAILY");
      url.searchParams.set("symbol", q);
      url.searchParams.set("outputsize", "compact");
      url.searchParams.set("apikey", process.env.ALPHAVANTAGE_KEY!);
    
      const raw = await getJSON<Record<string, unknown>>(url.toString());
    
      if (raw?.Note) {
        // Hit Alpha Vantage limit — try stale, else throw 429
        const stale = cacheGet<unknown>(key);
        if (stale) return stale;
        throw new Response(JSON.stringify({ error: "Alpha Vantage rate limit" }), { status: 429 });
      }
      if (raw?.["Error Message"]) {
        throw new Response(JSON.stringify({ error: "Invalid symbol" }), { status: 400 });
      }
    
      const parsed = AvDailySchema.safeParse(raw);
      if (!parsed.success) {
        return { q, range, items: [] };
      }
    
      const series = parsed.data["Time Series (Daily)"];
      const want = range === "7d" ? 7 : range === "14d" ? 14 : 30;
      const items = Object.entries(series)
        .map(([date, v]) => ({ date, close: Number((v as unknown as { "4. close": string })["4. close"]) || 0 }))
        .filter(p => Number.isFinite(p.close))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-want);
    
      const result = { q, range, items };

      console.log("[AV FETCH]", q, range, Date.now());
    
      // Cache the fresh payload (e.g., 5 min TTL)
      cacheSet(key, result, 5 * 60 * 1000);
      return result;
    });
    
    // 3) return the singleflight result (fresh or stale)
    return Response.json(payload, { headers: { "x-cache": cached ? "HIT" : "MISS-or-SHARED" } });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
