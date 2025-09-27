import { NextRequest } from "next/server";
import { batchClassify, mapFinBertLabel } from "@/lib/finbert";

export const runtime = "nodejs"; // ensure server runtime
export const preferredRegion = ["iad1", "dub1", "sfo1"]; // optional

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.headlines)) {
      return new Response(
        JSON.stringify({ error: "headlines array required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const texts: string[] = body.headlines.filter((t: unknown) => typeof t === "string");
    if (texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "no valid headlines" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const results = await batchClassify(texts, 16);

    // shape: [{ label: 'positive'|'neutral'|'negative', score: number } | { error }]
    return new Response(
      JSON.stringify({ count: results.length, items: results }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
}
