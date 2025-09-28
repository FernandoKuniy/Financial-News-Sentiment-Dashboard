import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../api/analyze/route";

const mk = (url: string) => new NextRequest(url);

describe("/api/analyze", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("aggregates, dedupes by URL, and returns top lists", async () => {
    // 1st fetch: /api/news
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            { title: "A surges on record revenue", url: "https://x/1", source: "S1", publishedAt: "2025-09-28" },
            { title: "A falls on guidance", url: "https://x/2", source: "S2", publishedAt: "2025-09-28" },
            { title: "A surges on record revenue", url: "https://x/1", source: "S1", publishedAt: "2025-09-28" }, // duplicate URL
          ],
        }),
        { status: 200 }
      )
    );

    // 2nd fetch: /api/sentiment
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            { label: "positive", score: 0.9 },
            { label: "negative", score: 0.7 },
          ],
        }),
        { status: 200 }
      )
    );

    const res = await GET(mk("http://test/api/analyze?q=AAPL&limit=30"));
    expect(res.status).toBe(200);
    const j = await res.json();

    expect(j.count).toBe(2); // deduped
    expect(j.summary.positive).toBe(1);
    expect(j.summary.negative).toBe(1);
    expect(j.topPositive.length).toBe(1);
    expect(j.topNegative.length).toBe(1);
    // weighted score = ( +0.9 + -0.7 ) / 2 = 0.1
    expect(Math.abs(j.summary.score - 0.1) < 1e-6).toBe(true);
  });

  it("handles missing q", async () => {
    const r = await GET(mk("http://test/api/analyze"));
    expect(r.status).toBe(400);
  });

  it("bubbles up sentiment failure", async () => {
    // news ok
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [{ title: "t", url: "u", source: "s", publishedAt: "d" }] }), { status: 200 })
    );
    // sentiment fails
    (fetch as unknown as Mock).mockResolvedValueOnce(new Response("boom", { status: 500 }));

    const r = await GET(mk("http://test/api/analyze?q=AAPL"));
    expect(r.status).toBe(502);
  });
});
