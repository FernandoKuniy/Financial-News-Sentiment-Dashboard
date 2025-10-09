const HF_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert";

export type SentLabel = "positive" | "neutral" | "negative";
export type SentOK = { label: SentLabel; score: number };
export type SentErr = { error: string };
export type SentItem = SentOK | SentErr;

export function mapFinBertLabel(raw: string): SentLabel {
    const n = (raw ?? "").toString().toLowerCase();
    if (n.includes("pos")) return "positive";
    if (n.includes("neu")) return "neutral";
    if (n.includes("neg")) return "negative";
    // Fallback for LABEL_0/1/2 if provider doesn't map names
    if (n.includes("label_")) {
      const idx = Number(n.replace("label_", ""));
      return idx === 2 ? "positive" : idx === 1 ? "neutral" : "negative";
    }
    return "negative";
}


function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(input, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

type Cand = { label?: unknown; class_name?: unknown; score?: unknown; probability?: unknown };
type Resp =
  | Cand[]                      // case 1
  | Cand[][]                    // case 2
  | { labels?: unknown[]; scores?: unknown[] }; // case 3

function pickScore(x: Cand): number {
  const v = typeof x.score === "number" ? x.score
        : typeof x.probability === "number" ? x.probability
        : NaN;
  return Number.isFinite(v) ? v : 0;
}
function pickLabel(x: Cand): string | null {
  if (typeof x.label === "string") return x.label;
  if (typeof x.class_name === "string") return x.class_name;
  return null;
}

function normalize(resp: Resp): Cand[] | null {
  // [[{label,score}]] -> [{...}]
  if (Array.isArray(resp) && Array.isArray(resp[0])) {
    return (resp[0] as Cand[]);
  }
  // [{label,score}] -> as is
  if (Array.isArray(resp)) return resp as Cand[];

  // {labels:[...], scores:[...]} -> zip to Cand[]
  if (resp && Array.isArray(resp.labels) && Array.isArray(resp.scores)) {
    const L = Math.min(resp.labels.length, resp.scores.length);
    const out: Cand[] = [];
    for (let i = 0; i < L; i++) {
      const label = typeof resp.labels[i] === "string" ? (resp.labels[i] as string) : String(resp.labels[i]);
      const score = typeof resp.scores[i] === "number" ? (resp.scores[i] as number) : Number(resp.scores[i]);
      out.push({ label, score });
    }
    return out;
  }
  return null;
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
        const json: unknown = await res.json();

        const cands = normalize(json as Resp);
        if (!cands || cands.length === 0) return { error: "unexpected HF shape" };

        const best = cands.reduce((a, b) => (pickScore(a) >= pickScore(b) ? a : b));
        const raw = pickLabel(best);
        if (!raw) return { error: "missing label" };

        const n = String(raw).toLowerCase();
        const label: SentLabel =
            n.includes("pos") ? "positive" :
            n.includes("neu") ? "neutral"  :
            n.includes("neg") ? "negative" :
            n.includes("label_") ? (Number(n.replace("label_", "")) === 2 ? "positive" : Number(n.replace("label_", "")) === 1 ? "neutral" : "negative")
                                : "negative";

        return { label, score: pickScore(best) };
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

export async function batchClassify(texts: string[]): Promise<SentItem[]> {
  // per-input requests with concurrency; guarantees 1:1 outputs
  return pMap(texts, (t) => classifyOne(t), 6);
}
