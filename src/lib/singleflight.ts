const inflight = new Map<string, Promise<unknown>>();
export async function singleflight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inflight.has(key)) return inflight.get(key)! as T;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
