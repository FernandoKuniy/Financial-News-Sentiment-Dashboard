
export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const maxRetries = 3;
  
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, { ...init, cache: "no-store" });
  
      // Success
      if (res.ok) return (await res.json()) as T;
  
      // 429 or 5xx → retry with backoff
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const ra = res.headers.get("retry-after");
        const retryMs = ra ? Number(ra) * 1000 : 250 * 2 ** attempt;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryMs));
          continue;
        }
      }
  
      // Final failure
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
  
    // Unreachable
    throw new Error("Unexpected fetch state");
  }
  