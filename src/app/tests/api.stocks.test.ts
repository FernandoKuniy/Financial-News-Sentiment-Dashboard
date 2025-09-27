import { GET } from "../api/stock/route";
import { NextRequest } from "next/server";

const mkReq = (url: string) => new NextRequest(url);

describe("/api/stock", () => {
  beforeEach(() => {
    (global as Record<string, unknown>).fetch = jest.fn();
    process.env.ALPHAVANTAGE_KEY = "x";
  });

  test("daily series normalized", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({
      "Meta Data": {}, "Time Series (Daily)": {
        "2025-09-23": { "1. open":"10","2. high":"11","3. low":"9","4. close":"10.5","5. volume":"1000" },
        "2025-09-22": { "1. open":"9","2. high":"10","3. low":"8","4. close":"9.5","5. volume":"2000" },
      }
    }), { status: 200 }));

    const res = await GET(mkReq("http://test/api/stock?symbol=AAPL"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.points.length).toBe(2);
    expect(json.points[0]).toHaveProperty("timestamp");
    expect(json.points[0]).toHaveProperty("open");
  });

  test("intraday key detection", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({
      "Time Series (30min)": {
        "2025-09-23 10:00:00": { "1. open":"10","2. high":"11","3. low":"9","4. close":"10.5","5. volume":"100" }
      }
    }), { status: 200 }));

    const res = await GET(mkReq("http://test/api/stock?symbol=AAPL&series=INTRADAY&interval=30min"));
    const json = await res.json();
    expect(json.points.length).toBe(1);
  });

  test("upstream error surfaced", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(new Response(JSON.stringify({
      "Note": "Thank you for using Alpha Vantage! Please try again"
    }), { status: 200 }));
    const res = await GET(mkReq("http://test/api/stock?symbol=AAPL"));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.points).toEqual([]);
    expect(String(json.error)).toMatch(/Thank you/i);
  });
});
