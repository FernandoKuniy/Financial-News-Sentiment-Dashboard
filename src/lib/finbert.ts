const HF_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert";

export type SentLabel = "positive" | "neutral" | "negative";
export type SentOK = { label: SentLabel; score: number };
export type SentErr = { error: string };
export type SentItem = SentOK | SentErr;

const mapFinBertLabel = (raw: string): SentLabel =>
  raw.toLowerCase().includes("pos") ? "positive"
  : raw.toLowerCase().includes("neu") ? "neutral"
  : "negative";

type OneResp = Array<{ label: string; score: number }>;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

async function classifyOne(
  text: string,
  { timeoutMs = 10_000, attempts = 2, baseDelayMs = 300 }: { timeoutMs?: number; attempts?: number; baseDelayMs?: number } = {}
): Promise<SentItem> {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY ?? ""}`,
  };
  let lastErr = "unknown error";

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(
        HF_URL,
        { method: "POST", headers, body: JSON.stringify({ inputs: text, parameters: { return_all_scores: true } }) },
        timeoutMs
      );
      if (res.status === 401 || res.status === 403) return { error: `HF ${res.status}: ${await res.text()}` };
      if (res.status === 429 || res.status === 503) { lastErr = `HF ${res.status}: ${await res.text()}`; }
      else if (!res.ok) { lastErr = `HF ${res.status}: ${await res.text()}`; }
      else {
        const arr: unknown = await res.json();
        if (!Array.isArray(arr)) return { error: "unexpected HF shape" };
        const candidates = arr as OneResp; // single input → single array
        if (candidates.length === 0) return { error: "empty inference result" };
        const best = candidates.reduce((a, b) => (a.score >= b.score ? a : b));
        return { label: mapFinBertLabel(best.label), score: best.score };
      }
    } catch (e) {
      lastErr = e instanceof Error && e.name === "AbortError" ? "timeout" : String(e);
    }
    await sleep(baseDelayMs * 2 ** i);
  }
  return { error: lastErr };
}

// limit parallelism to avoid rate limits
async function pMap<T, R>(items: T[], fn: (t: T) => Promise<R>, concurrency = 6): Promise<R[]> {
  const out: R[] = Array(items.length) as unknown as R[];
  let i = 0;
  const workers = Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function batchClassify(texts: string[], _batchSize = 16): Promise<SentItem[]> {
  // per-input requests with concurrency; guarantees 1:1 outputs
  return pMap(texts, (t) => classifyOne(t), 6);
}

export { mapFinBertLabel };
