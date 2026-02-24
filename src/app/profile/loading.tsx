import { ViewportSection } from "@/components/viewport-section";

export default function ProfileLoading() {
  return (
    <ViewportSection innerClassName="space-y-8 pt-6 pb-20">
      <div className="h-6 w-24 animate-pulse rounded bg-ink-800" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card h-28 animate-pulse" />
        <div className="card h-28 animate-pulse" />
        <div className="card h-28 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card h-32 animate-pulse" />
        <div className="card h-32 animate-pulse" />
      </div>
    </ViewportSection>
  );
}
