import { NextRequest } from "next/server";
import { z } from "zod";
import { getJSON } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PointSchema = z.object({
  timestamp: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const series = (searchParams.get("series") || "DAILY").toUpperCase(); // DAILY | INTRADAY
    const interval = searchParams.get("interval") || "60min";

    if (!symbol) return Response.json({ error: "Missing symbol" }, { status: 400 });
    if (!process.env.ALPHAVANTAGE_KEY) return Response.json({ error: "Server missing ALPHAVANTAGE_KEY" }, { status: 500 });

    const base = "https://www.alphavantage.co/query";
    const params = new URLSearchParams();
    if (series === "INTRADAY") {
      params.set("function", "TIME_SERIES_INTRADAY");
      params.set("symbol", symbol);
      params.set("interval", interval);
      params.set("outputsize", "compact");
    } else {
      params.set("function", "TIME_SERIES_DAILY");
      params.set("symbol", symbol);
      params.set("outputsize", "compact");
    }
    params.set("apikey", process.env.ALPHAVANTAGE_KEY);

    const data = await getJSON<Record<string, unknown>>(`${base}?${params.toString()}`);

    // Explicit Alpha Vantage error surfaces
    const upstreamErr = data?.Note || data?.["Error Message"] || data?.Information;
    if (upstreamErr) {
      // Premium/limit/invalid symbol → 502 to indicate upstream issue
      return Response.json({ symbol, series, interval, points: [], error: upstreamErr }, { status: 502 });
    }

    // Pick correct time series node
    let key: string | undefined;
    if (series === "INTRADAY") {
      key = Object.keys(data).find(k => k.toLowerCase().includes("time series"));
    } else {
      key = "Time Series (Daily)";
    }
    const ts = key ? (data as Record<string, unknown>)[key] as Record<string, Record<string, string>> : undefined;
    if (!ts || typeof ts !== "object") return Response.json({ symbol, series, interval, points: [] });

    const points = Object.entries(ts).map(([t, o]) => ({
      timestamp: t,
      open: Number(o["1. open"]),
      high: Number(o["2. high"]),
      low: Number(o["3. low"]),
      close: Number(o["4. close"]),
      volume: Number(o["6. volume"] ?? o["5. volume"] ?? 0),
    }))
    .filter(p => Number.isFinite(p.open) && Number.isFinite(p.close));

    // Validate normalized points (optional but safe)
    const safe = points.filter(p => PointSchema.safeParse(p).success);

    safe.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return Response.json({ symbol, series, interval, points: safe });
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "error");
    const status = /HTTP 429/.test(msg) ? 429 : 500;
    return Response.json({ error: msg }, { status });
  }

  //testing openai connector
}
