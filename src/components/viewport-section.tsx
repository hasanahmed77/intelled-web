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
  const sectionClass = `pt-[calc(var(--navbar-h)+0.5rem)] pb-6 ${className}`.trim();
  const baseInnerClass = "min-h-[calc(100svh-var(--navbar-h)-0.5rem)] py-4";
  const centeredClass = center ? " flex items-center justify-center" : "";
  const combinedInnerClass = `${baseInnerClass}${centeredClass} ${innerClassName}`.trim();

  return (
    <section className={sectionClass}>
      <div className={combinedInnerClass}>{children}</div>
    </section>
  );
}
