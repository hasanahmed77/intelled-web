import { ViewportSection } from "@/components/viewport-section";

export default function LeaderboardLoading() {
  return (
    <ViewportSection innerClassName="space-y-8 pt-6 pb-20">
      <div className="space-y-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-ink-800" />
        <div className="h-9 w-48 animate-pulse rounded-xl bg-ink-800" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-ink-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4 p-5">
            <div className="h-6 w-8 animate-pulse rounded bg-ink-800" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-ink-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-ink-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-ink-800" />
            </div>
            <div className="hidden space-y-2 text-right sm:block">
              <div className="h-4 w-24 animate-pulse rounded bg-ink-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-ink-800" />
            </div>
          </div>
        ))}
      </div>
    </ViewportSection>
  );
}
