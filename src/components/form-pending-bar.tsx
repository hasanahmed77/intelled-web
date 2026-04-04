"use client";

import { useFormStatus } from "react-dom";

type FormPendingBarButtonProps = {
  label: string;
  className?: string;
  disabledClassName?: string;
  scrollToTopOnClick?: boolean;
};

export function FormPendingBarButton({
  label,
  className = "button button-primary w-full",
  disabledClassName = "opacity-75",
  scrollToTopOnClick = false
}: FormPendingBarButtonProps) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        className={`${className} ${pending ? disabledClassName : ""}`.trim()}
        type="submit"
        disabled={pending}
        onClick={() => {
          if (scrollToTopOnClick) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        {pending ? "Processing..." : label}
      </button>
    </>
  );
}

export function FormPendingBar() {
  const { pending } = useFormStatus();

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-[inherit] transition-opacity ${
        pending ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div className="form-loading-bar h-full w-1/3 bg-accent" />
    </div>
  );
}
