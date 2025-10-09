"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQ(initial);
  }, [initial]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQ(value);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Hide typing indicator after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  function submit() {
    const next = q.trim();
    if (!next) return;
    
    setIsSearching(true);
    const url = `/?q=${encodeURIComponent(next)}`;
    router.push(url);
    
    // Reset searching state after a short delay to allow for loading state to show
    setTimeout(() => setIsSearching(false), 100);
  }

  return (
    <div className="flex gap-2 w-full max-w-3xl">
      <Input
        ref={inputRef}
        inputMode="text"
        aria-label="Search ticker or topic"
        placeholder="Search ticker or topic… e.g., AAPL or 'AI chips'"
        value={q}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit();
          }
        }}
        disabled={isSearching}
        className={`${isSearching ? "opacity-75" : ""} ${isTyping ? "ring-2 ring-blue-400" : ""} bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400`}
      />
      <Button 
        type="button" 
        onClick={submit} 
        aria-label="Run analysis"
        disabled={isSearching || !q.trim()}
        className="min-w-[44px] bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700 disabled:opacity-50"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
}
