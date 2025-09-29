export async function jsonFetcher<T>(url: string): Promise<T> {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text || ""}`.trim());
    }
    return res.json();
  }
  