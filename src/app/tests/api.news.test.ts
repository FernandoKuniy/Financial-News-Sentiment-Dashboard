import { GET } from "../api/news/route";
import { NextRequest } from "next/server";
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";

const mkReq = (url: string) => new NextRequest(url);

describe("/api/news", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
    process.env.NEWSAPI_KEY = "x";
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes and returns items", async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "ok",
          articles: [
            { title: "t1", url: "https://x", source: { name: "S1" }, publishedAt: "2025-09-23" },
            { title: "t2", url: "https://y", source: { name: "S2" }, publishedAt: "2025-09-22" }
          ]
        }),
        { status: 200 }
      )
    );

    const res = await GET(mkReq("http://test/api/news?q=AAPL&limit=2"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.items[0]).toEqual({
      title: "t1", url: "https://x", source: "S1", publishedAt: "2025-09-23"
    });
  });

  it("handles 429 with retry exhaustion", async () => {
    (fetch as unknown as Mock).mockResolvedValue(
      new Response("rate limit", { status: 429 })
    );
    const res = await GET(mkReq("http://test/api/news?q=AAPL"));
    expect([429, 500]).toContain(res.status);
    const body = await res.json();
    expect(String(body.error)).toMatch(/HTTP 429|rate limit/i);
  });

  it("empty results tolerated", async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", articles: [] }), { status: 200 })
    );
    const res = await GET(mkReq("http://test/api/news?q=RARE"));
    const json = await res.json();
    expect(json.count).toBe(0);
    expect(json.items).toEqual([]);
  });
});
