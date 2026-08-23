import Link from "next/link";

// Shown for a URL that matches nothing. There is only one page in this app, so the way back is
// unambiguous.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Nothing here</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This page doesn&apos;t exist. The whole app is one search box, so you haven&apos;t missed
        much.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-2">
          Back to the search
        </Link>
      </p>
    </main>
  );
}
