"use client";

import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * The failure state for the analysis.
 *
 * Amber, not red. Red means a negative headline everywhere else on this page, and a request
 * that did not come back is a different kind of fact. The message from the fetch is shown
 * verbatim underneath, because the usual cause is one of the three upstream APIs returning a
 * 429 and its own text says so.
 */
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
    <Alert
      role="alert"
      className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>Couldn&apos;t analyse {query ? `"${query}"` : "that"}</AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {/* Long upstream errors wrap instead of stretching the alert off the page. */}
        <p className="break-words">{message}</p>
        <p className="text-amber-700 dark:text-amber-300">
          NewsAPI allows 100 requests a day and Alpha Vantage 25, so this is often just the daily
          limit.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-1 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900"
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
