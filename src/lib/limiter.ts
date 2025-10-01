// token-bucket limiter: 5 tokens per 60s
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