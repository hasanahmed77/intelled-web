import type { ReactNode } from "react";

type ViewportSectionProps = {
  children: ReactNode;
  center?: boolean;
  className?: string;
  innerClassName?: string;
};

export function ViewportSection({
  children,
  center = false,
  className = "",
  innerClassName = ""
}: ViewportSectionProps) {
  const sectionClass = `pt-[var(--navbar-h)] ${className}`.trim();
  const baseInnerClass = "min-h-[calc(100svh-var(--navbar-h))]";
  const centeredClass = center ? " flex items-center justify-center" : "";
  const combinedInnerClass = `${baseInnerClass}${centeredClass} ${innerClassName}`.trim();

  return (
    <section className={sectionClass}>
      <div className={combinedInnerClass}>{children}</div>
    </section>
  );
}
