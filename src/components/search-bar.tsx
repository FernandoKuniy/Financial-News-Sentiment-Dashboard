"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ(initial);
  }, [initial]);

  function submit() {
    const next = q.trim();
    const url = next ? `/?q=${encodeURIComponent(next)}` : "/";
    router.push(url);
  }

  return (
    <div className="flex gap-2 w-full max-w-3xl">
      <Input
        ref={inputRef}
        inputMode="text"
        aria-label="Search ticker or topic"
        placeholder="Search ticker or topic… e.g., AAPL or 'AI chips'"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit();
          }
        }}
      />
      <Button type="button" onClick={submit} aria-label="Run analysis">
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
}
