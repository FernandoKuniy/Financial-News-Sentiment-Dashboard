// The route-level loading state, shown while the page shell resolves. Deliberately quiet: the
// interesting waiting happens inside the analysis, which has its own skeletons shaped like the
// result. A second spinner out here would just be noise.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10">
      <p className="text-sm text-zinc-500">Loading…</p>
    </main>
  );
}
