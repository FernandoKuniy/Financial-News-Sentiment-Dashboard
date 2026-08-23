"use client";

// Catches an unhandled error anywhere in the app so a bad response from one of the three
// upstream APIs never drops someone onto a stack trace. Client component by requirement, since
// it holds `reset`.

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No error tracker wired up, so at least put it in the console.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That didn&apos;t load</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Something broke on our side. The usual cause is one of the upstream APIs hitting its free
        tier limit for the day, which sorts itself out.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Try again
      </button>
      <p className="mt-6 text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-2">
          Back to the search
        </Link>
      </p>
    </main>
  );
}
