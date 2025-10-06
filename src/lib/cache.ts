// simple in-memory cache (per server instance)
type Entry<T> = { v: T; exp: number; t: number };
const store = new Map<string, Entry<unknown>>();
const MAX_SIZE = 400; // cap to avoid memory blow-up

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    store.delete(key);
    return null;
  }
  e.t = Date.now(); // bump recency
  return e.v as T;
}

export function cacheSet<T>(key: string, v: T, ttlMs: number) {
  const now = Date.now();
  store.set(key, { v, exp: now + ttlMs, t: now });
  if (store.size > MAX_SIZE) evictOldest();
}

// Optional: allow manual clearing (useful for debugging)
export function cacheClear() {
  store.clear();
}

function evictOldest() {
  // remove ~10% oldest
  const nDrop = Math.ceil(store.size * 0.1);
  const arr = [...store.entries()].sort((a, b) => a[1].t - b[1].t);
  for (let i = 0; i < nDrop; i++) {
    store.delete(arr[i][0]);
  }
}