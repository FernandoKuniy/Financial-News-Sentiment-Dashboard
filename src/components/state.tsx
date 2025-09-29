"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export function LoadingState() {
  return (
    <div aria-live="polite" className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  query,
}: {
  message: string;
  onRetry: () => void;
  query?: string | null;
}) {
  return (
    <Alert variant="destructive" role="alert" className="rounded-2xl">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>Failed to load{query ? ` “${query}”` : ""}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-3">
        <span className="text-sm">{message}</span>
        <Button size="sm" onClick={onRetry} aria-label="Retry loading">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
