"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * The search box. A real form, so Enter submits and the browser does the keyboard handling
 * rather than an onKeyDown that only listens for one key.
 *
 * Two indicators used to live here and both have gone. A `isTyping` ring lit up for a second
 * after every keystroke, which reported nothing except that the keyboard worked. A `isSearching`
 * flag disabled the input and spun a loader for a fixed 100ms that had no relationship to the
 * request. The actual wait is the analysis, and PageClient shows that with skeletons.
 */
export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);

  // Keep the box in step when the query changes from outside, such as the back button.
  useEffect(() => {
    setQ(initial);
  }, [initial]);

  const trimmed = q.trim();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2">
      <label htmlFor="ticker-search" className="sr-only">
        Ticker or topic
      </label>
      <Input
        id="ticker-search"
        name="q"
        inputMode="text"
        autoComplete="off"
        placeholder="AAPL, TSLA, or a topic like AI chips"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={!trimmed}>
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
