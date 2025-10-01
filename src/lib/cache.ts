// simple in-memory cache (per server instance)
type Entry<T> = { v: T; exp: number };
const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { store.delete(key); return null; }
  return e.v as T;
}
export function cacheSet<T>(key: string, v: T, ttlMs: number) {
  store.set(key, { v, exp: Date.now() + ttlMs });
}