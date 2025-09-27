const HF_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert";

export type SentLabel = "positive" | "neutral" | "negative";
export type SentOK = { label: SentLabel; score: number };
export type SentErr = { error: string };
export type SentItem = SentOK | SentErr;

const mapFinBertLabel = (raw: string): SentLabel =>
  raw.toLowerCase().includes("pos") ? "positive"
  : raw.toLowerCase().includes("neu") ? "neutral"
  : "negative";

type HFResp = Array<Array<{ label: string; score: number }>>;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function callHF(
  inputs: string[],
  opts: { timeoutMs?: number; attempts?: number; baseDelayMs?: number } = {}
): Promise<SentItem[]> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 400;

  const body = JSON.stringify({ inputs });
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY ?? ""}`,
  };

  let lastErr = "unknown error";
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchWithTimeout(HF_URL, { method: "POST", headers, body }, timeoutMs);

      // Warmup / loading
      if (res.status === 503) {
        lastErr = `HF 503: ${await res.text()}`;
      } else if (res.status === 429) {
        lastErr = `HF 429: ${await res.text()}`;
      } else if (res.status === 401 || res.status === 403) {
        lastErr = `HF ${res.status}: ${await res.text()}`;
        break; // auth won’t improve with retries
      } else if (!res.ok) {
        lastErr = `HF ${res.status}: ${await res.text()}`;
      } else {
        const data: HFResp = await res.json();
        // FinBERT returns array of arrays; choose max score per input
        return data.map((arr) => {
          if (!Array.isArray(arr) || arr.length === 0) return { error: "empty inference result" };
          const best = arr.reduce((a, b) => (a.score >= b.score ? a : b));
          return { label: mapFinBertLabel(best.label), score: best.score };
        });
      }
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : String(e);
    }

    // backoff with jitter
    const delay = baseDelayMs * 2 ** i + Math.floor(Math.random() * 100);
    await sleep(delay);
  }

  // All attempts failed -> return errors for each input
  return inputs.map(() => ({ error: lastErr }));
}

export async function batchClassify(texts: string[], batchSize = 16): Promise<SentItem[]> {
  const out: SentItem[] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const res = await callHF(slice);
    out.push(...res); // partial failures produce {error} entries, successes preserved
  }
  return out;
}

export { mapFinBertLabel };
