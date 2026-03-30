"use client";

export function ConfirmActionForm({
  action,
  title,
  message,
  buttonLabel,
  className
}: {
  action: () => void | Promise<void>;
  title: string;
  message: string;
  buttonLabel: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={className ?? "button"}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
