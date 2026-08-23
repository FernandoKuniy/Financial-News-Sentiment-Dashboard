import { Suspense } from "react";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic"; // avoid prerender issues with client-only data
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 text-sm text-zinc-500">Loading…</div>}>
      <PageClient />
    </Suspense>
  );
}

