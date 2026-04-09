import type { QuestionGradingMetadata } from "@/lib/grading/types";

const SYMBOLIC_PATTERNS = [
  /\brelational algebra\b/i,
  /\bexpression\b/i,
  /\bwrite .* formula\b/i,
  /\bsimplify\b/i,
  /\bderive\b/i,
  /\bsolve\b/i,
  /\bprove\b/i,
  /\bevaluate\b/i
];

export function inferQuestionGradingMetadata(prompt: string): QuestionGradingMetadata {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("relational algebra") ||
    normalized.includes("projection") ||
    normalized.includes("selection") ||
    normalized.includes("employees(") ||
    normalized.includes("departments(")
  ) {
    return { domain: "relational_algebra", answerKind: "symbolic_expression" };
  }

  if (
    normalized.includes("sql query") ||
    normalized.includes("select ") ||
    normalized.includes("from ") ||
    normalized.includes("where ")
  ) {
    return { domain: "sql", answerKind: "code" };
  }

  if (normalized.includes("truth table") || normalized.includes("logical") || normalized.includes("boolean")) {
    return { domain: "logic", answerKind: "symbolic_expression" };
  }

  if (normalized.includes("write code") || normalized.includes("function") || normalized.includes("program")) {
    return { domain: "code", answerKind: "code" };
  }

  if (SYMBOLIC_PATTERNS.some((pattern) => pattern.test(prompt))) {
    return { domain: "math", answerKind: "formula" };
  }

  if (prompt.length > 220) {
    return { domain: "general", answerKind: "free_text" };
  }

  return { domain: "general", answerKind: "short_text" };
}
