import { GET } from "../api/news/route";
import { NextRequest } from "next/server";

const mkReq = (url: string) => new NextRequest(url);

describe("/api/news", () => {
  beforeEach(() => {
    (global as Record<string, unknown>).fetch = jest.fn();
    process.env.NEWSAPI_KEY = "x";
  });

  test("normalizes and returns items", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({
      status: "ok",
      articles: [
        { title: "t1", url: "https://x", source: { name: "S1" }, publishedAt: "2025-09-23" },
        { title: "t2", url: "https://y", source: { name: "S2" }, publishedAt: "2025-09-22" },
      ]
    }), { status: 200 }));

    const res = await GET(mkReq("http://test/api/news?q=AAPL&limit=2"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.items[0]).toEqual({
      title: "t1", url: "https://x", source: "S1", publishedAt: "2025-09-23"
    });
  });

  test("handles 429 with retry exhaustion", async () => {
    (fetch as jest.Mock).mockResolvedValue(new Response("rate limit", { status: 429 }));
    const res = await GET(mkReq("http://test/api/news?q=AAPL"));
    expect([429,500]).toContain(res.status);
    const body = await res.json();
    expect(String(body.error)).toMatch(/HTTP 429|rate limit/i);
  });

  test("empty results tolerated", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({
      status: "ok",
      articles: []
    }), { status: 200 }));
    const res = await GET(mkReq("http://test/api/news?q=RARE"));
    const json = await res.json();
    expect(json.count).toBe(0);
    expect(json.items).toEqual([]);
  });
});
