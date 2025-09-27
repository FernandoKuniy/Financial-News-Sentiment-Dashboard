// src/app/api/sentiment/route.ts
import { NextRequest } from "next/server";
import { batchClassify } from "@/lib/finbert";
import { SentimentReq } from "@/lib/schemas";

export const runtime = "nodejs";
export const preferredRegion = ["iad1", "dub1", "sfo1"];

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SentimentReq.safeParse(json);
    if (!parsed.success) {
      // over-limit gets 413; other validation errors 400
      const tooMany =
        parsed.error.issues.some(i => i.code === "too_big" && i.path[0] === "headlines");
      const status = tooMany ? 413 : 400;
      return new Response(
        JSON.stringify({ error: parsed.error.flatten() }),
        { status, headers: { "content-type": "application/json" } }
      );
    }

    const texts = parsed.data.headlines;
    const results = await batchClassify(texts, 16);

    return new Response(
      JSON.stringify({ count: results.length, items: results }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
}

