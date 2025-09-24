import { NextRequest } from "next/server";
import { getJSON } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol"); // e.g., AAPL
    const series = searchParams.get("series") || "DAILY"; // DAILY or INTRADAY
    const interval = searchParams.get("interval") || "60min"; // for intraday

    if (!symbol) return Response.json({ error: "Missing symbol" }, { status: 400 });
    if (!process.env.ALPHAVANTAGE_KEY) {
      return Response.json({ error: "Server missing ALPHAVANTAGE_KEY" }, { status: 500 });
    }

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

    // Normalize into { timestamp, open, high, low, close, volume }[]
    const key =
      series === "INTRADAY"
        ? Object.keys(data).find(k => k.includes("Time Series"))
        : "Time Series (Daily)";
    const ts = key ? data[key] : null;
    if (!ts) return Response.json({ symbol, points: [] });

    const points = Object.entries(ts).map(([t, o]: [string, Record<string, unknown>]) => ({
      timestamp: t,
      open: Number(o["1. open"]),
      high: Number(o["2. high"]),
      low: Number(o["3. low"]),
      close: Number(o["4. close"]),
      volume: Number(o["6. volume"] ?? o["5. volume"]),
    }));

    points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return Response.json({ symbol, series, interval, points });
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
