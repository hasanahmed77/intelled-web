export type GradingDomain =
  | "general"
  | "math"
  | "logic"
  | "sql"
  | "relational_algebra"
  | "code";

export type AnswerKind = "short_text" | "symbolic_expression" | "formula" | "code" | "free_text";

export type QuestionGradingMetadata = {
  domain: GradingDomain;
  answerKind: AnswerKind;
};
