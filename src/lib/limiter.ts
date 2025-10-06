// token-bucket limiter: 5 tokens per 60s (e.g., for price API)
const CAP = 5;
const WINDOW_MS = 60_000;
let tokens = CAP;
let last = Date.now();

export function takeToken() {
  const now = Date.now();
  const elapsed = now - last;
  last = now;
  tokens = Math.min(CAP, tokens + (elapsed / WINDOW_MS) * CAP);
  if (tokens >= 1) { tokens -= 1; return true; }
  return false;
}

// factory to create independent token buckets (e.g., for NewsAPI)
export function createTokenBucket(cap = 1, windowMs = 1000) {
  let t = cap;
  let prev = Date.now();
  return function take() {
    const now = Date.now();
    const elapsed = now - prev;
    prev = now;
    t = Math.min(cap, t + (elapsed / windowMs) * cap);
    if (t >= 1) { t -= 1; return true; }
    return false;
  };
}