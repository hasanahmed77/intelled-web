"use client";

export function LoadingBar({ active }: { active: boolean }) {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-ink-800">
      <div
        className={`absolute left-0 top-0 h-full w-1/3 bg-accent transition-opacity duration-200 ${
          active ? "opacity-100 animate-loading" : "opacity-0"
        }`}
      />
    </div>
  );
}
