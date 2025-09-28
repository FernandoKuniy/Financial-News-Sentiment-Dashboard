"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-800 p-4 animate-pulse">
      <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
      <div className="h-8 w-14 bg-neutral-800 rounded" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="w-full h-64 rounded-2xl border border-neutral-800 p-3 animate-pulse">
      <div className="h-full w-full bg-neutral-900 rounded" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="rounded-xl border border-neutral-800 p-3 animate-pulse">
          <div className="h-4 w-3/4 bg-neutral-800 rounded mb-2" />
          <div className="h-3 w-1/2 bg-neutral-800 rounded" />
        </li>
      ))}
    </ul>
  );
}
