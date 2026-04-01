export default function ProfileLoading() {
  return (
    <div className="pt-[calc(var(--navbar-h)+1.5rem)] pb-20">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-5 w-20 animate-pulse rounded-full bg-ink-800" />
        <div className="h-9 w-48 animate-pulse rounded-xl bg-ink-800" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-ink-800" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar skeleton — desktop only */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-ink-800/70" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Mobile tab strip skeleton */}
          <div className="flex gap-2 lg:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-ink-800" />
            ))}
          </div>

          <div className="h-6 w-32 animate-pulse rounded-lg bg-ink-800" />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card h-28 animate-pulse" />
            <div className="card h-28 animate-pulse" />
            <div className="card h-28 animate-pulse" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card h-36 animate-pulse" />
            <div className="card h-36 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
