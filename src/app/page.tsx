import { Suspense } from "react";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic"; // avoid prerender issues with client-only data
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-6">Loading…</div>}>
      <PageClient />
    </Suspense>
  );
}

