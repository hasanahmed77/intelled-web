"use client";

import { MAX_ANSWER_CHARACTERS } from "@/lib/worksheet/limits";

type MathAnswerInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function MathAnswerInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Your answer"
}: MathAnswerInputProps) {
  const remaining = MAX_ANSWER_CHARACTERS - value.length;

  return (
    <div className="space-y-2">
      <textarea
        className="input min-h-[120px] resize-y whitespace-pre-wrap"
        placeholder={placeholder}
        value={value}
        maxLength={MAX_ANSWER_CHARACTERS}
        disabled={disabled}
        readOnly={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex justify-end text-xs text-muted">
        <span className={remaining < 80 ? "text-accent" : undefined}>
          {value.length} / {MAX_ANSWER_CHARACTERS}
        </span>
      </div>
    </div>
  );
}
