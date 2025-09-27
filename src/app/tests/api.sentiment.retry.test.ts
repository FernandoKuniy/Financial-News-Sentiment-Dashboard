import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../api/sentiment/route";

const mk = (b: unknown) =>
  new NextRequest("http://test/api/sentiment", { method: "POST", body: JSON.stringify(b) });

describe("/api/sentiment guardrails", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
    process.env.HUGGING_FACE_API_KEY = "hf_test";
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries on 503 then succeeds", async () => {
    (fetch as unknown as Mock)
      .mockResolvedValueOnce(new Response("warming", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            [{ label: "positive", score: 0.9 }, { label: "neutral", score: 0.1 }],
          ]),
          { status: 200 }
        )
      );

    const r = await POST(mk({ headlines: ["ok"] }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.items[0].label).toBe("positive");
  });

  it("returns error items after exhausting retries", async () => {
    (fetch as unknown as Mock)
      .mockResolvedValue(new Response("temporary", { status: 503 }));

    const r = await POST(mk({ headlines: ["a", "b"] }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.items).toHaveLength(2);
    expect(j.items.every((x: Record<string, unknown>) => "error" in x)).toBe(true);
  });

  it("does not retry on 403", async () => {
    (fetch as unknown as Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "forbidden" }), { status: 403 })
    );
    const r = await POST(mk({ headlines: ["x"] }));
    const j = await r.json();
    expect(j.items[0].error).toMatch(/403/i);
    expect((fetch as unknown as Mock).mock.calls.length).toBe(1);
  });
});
