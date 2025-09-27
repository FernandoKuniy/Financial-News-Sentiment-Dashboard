import { describe, it, expect } from "vitest";
import { POST } from "../api/sentiment/route";
import { NextRequest } from "next/server";

const mk = (body: unknown) =>
  new NextRequest("http://test/api/sentiment", { method: "POST", body: JSON.stringify(body) });

describe("/api/sentiment schema", () => {
  it("413 when >64 headlines", async () => {
    const big = Array.from({ length: 65 }, (_, i) => `h${i + 1}`);
    const res = await POST(mk({ headlines: big }));
    expect(res.status).toBe(413);
  });

  it("400 when empty or invalid", async () => {
    const res1 = await POST(mk({ headlines: [] }));
    expect(res1.status).toBe(400);
    const res2 = await POST(mk({})); // missing field
    expect(res2.status).toBe(400);
  });
});
