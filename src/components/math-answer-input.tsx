"use client";

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
  return (
    <textarea
      className="input min-h-[120px] resize-y whitespace-pre-wrap"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readOnly={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
