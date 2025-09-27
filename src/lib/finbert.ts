export type SentimentLabel = "positive" | "neutral" | "negative";
export type SentimentItem = { label: SentimentLabel; score: number };

const HF_MODEL = "ProsusAI/finbert";
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export function mapFinBertLabel(raw: string): SentimentLabel {
  const n = raw.toLowerCase();
  if (n.includes("pos")) return "positive";
  if (n.includes("neu")) return "neutral";
  return "negative"; // default fallback
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return new Promise((resolve, reject) => {
    p.then(resolve).catch(reject).finally(() => clearTimeout(t));
  });
}

async function classifyBatch(texts: string[]): Promise<(SentimentItem | { error: string })[]> {
  const key = process.env.HUGGING_FACE_API_KEY;
  if (!key) throw new Error("HUGGING_FACE_API_KEY not set");

  const controller = new AbortController();
  const fetchPromise = fetch(HF_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, parameters: { return_all_scores: true } }),
    signal: controller.signal,
    cache: "no-store",
  });

  try {
    const res = await withTimeout(fetchPromise, 15000); // 15s timeout
    if (!res.ok) {
      const msg = await res.text();
      // Finbert may be warming up (503). Surface partial failure.
      return texts.map(() => ({ error: `HF ${res.status}: ${msg.slice(0, 140)}` }));
    }
    const data = await res.json();
    // data is Array< Array<{label:string,score:number}> > when return_all_scores=true
    if (!Array.isArray(data)) return texts.map(() => ({ error: "unexpected HF shape" }));

    return data.map((candidates: unknown) => {
      if (!Array.isArray(candidates) || candidates.length === 0) return { error: "empty candidates" };
      const best = candidates.reduce((a: { score: number }, b: { score: number }) => (a.score >= b.score ? a : b));
      return { label: mapFinBertLabel(String(best.label)), score: Number(best.score) } as SentimentItem;
    });
  } catch (e: unknown) {
    const err = (e as Error)?.name === "AbortError" ? "timeout" : String((e as Error)?.message || e);
    return texts.map(() => ({ error: err }));
  }
}

export async function batchClassify(texts: string[], batchSize = 16): Promise<(SentimentItem | { error: string })[]> {
  const out: (SentimentItem | { error: string })[] = [];
  // Simple exponential backoff per batch on failure signals
  const chunks: string[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) chunks.push(texts.slice(i, i + batchSize));

  for (const chunk of chunks) {
    let attempt = 0;
    while (true) {
      const result = await classifyBatch(chunk);
      const hadError = result.some(r => 'error' in r);
      out.push(...result);
      if (!hadError) break;
      attempt++;
      if (attempt >= 3) break; // stop after 3 tries
      await sleep(500 * 2 ** (attempt - 1)); // 0.5s, 1s
    }
  }
  return out;
}