import { ViewportSection } from "@/components/viewport-section";

export default function PricingLoading() {
  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-7 w-24 animate-pulse rounded-full border border-ink-700 bg-ink-900/70" />
          <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-2xl bg-ink-900/70" />
          <div className="mx-auto h-6 w-full max-w-2xl animate-pulse rounded-xl bg-ink-900/50" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card p-6">
              <div className="h-4 w-28 animate-pulse rounded bg-ink-900/70" />
              <div className="mt-4 h-10 w-24 animate-pulse rounded bg-ink-900/70" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card p-6">
              <div className="h-8 w-24 animate-pulse rounded bg-ink-900/70" />
              <div className="mt-3 h-5 w-full animate-pulse rounded bg-ink-900/50" />
              <div className="mt-8 h-10 w-36 animate-pulse rounded bg-ink-900/70" />
              <div className="mt-6 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-ink-900/50" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-ink-900/50" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-ink-900/50" />
              </div>
              <div className="mt-8 h-11 w-full animate-pulse rounded-full bg-ink-900/70" />
            </div>
          ))}
        </div>
      </div>
    </ViewportSection>
  );
}
