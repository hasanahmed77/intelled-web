import type { QuestionGradingMetadata } from "@/lib/grading/types";
import { normalizeGeneralAnswer } from "@/lib/grading/normalize";

function singularizeToken(token: string) {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("sses")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function normalizeIdentifier(token: string) {
  return singularizeToken(token.replace(/[^a-z0-9]/g, ""));
}

function sortInsensitiveList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

function canonicalizeSql(value: string) {
  const normalized = normalizeGeneralAnswer(value)
    .replace(/\binner join\b/g, "join")
    .replace(/\bleft outer join\b/g, "left join")
    .replace(/\bright outer join\b/g, "right join")
    .replace(/\s*;\s*$/g, "")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s+/g, " ")
    .trim();

  const selectMatch = normalized.match(/\bselect\s+(.+?)\s+from\s+/);
  const whereMatch = normalized.match(/\bwhere\s+(.+)$/);

  let result = normalized;

  if (selectMatch) {
    result = result.replace(selectMatch[1], sortInsensitiveList(selectMatch[1]));
  }

  if (whereMatch) {
    const sortedConditions = whereMatch[1]
      .split(/\s+and\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .sort()
      .join(" and ");
    result = result.replace(whereMatch[1], sortedConditions);
  }

  return result;
}

function canonicalizeMath(value: string) {
  return normalizeGeneralAnswer(value)
    .replace(/[()[\]{}]/g, (match) => {
      if (match === "[" || match === "{") return "(";
      if (match === "]" || match === "}") return ")";
      return match;
    })
    .replace(/\s+/g, "")
    .replace(/\+\-/g, "-")
    .replace(/\-\-/g, "+");
}

function canonicalizeRelationalAlgebra(value: string) {
  return normalizeGeneralAnswer(value)
    .replace(/\bjoin\b/g, "⨝")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s*,\s*/g, ",")
    .replace(/([(),.=<>*+/\-×⨝πσ])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[a-z0-9_.]+$/.test(token)) {
        return normalizeIdentifier(token);
      }
      return token;
    })
    .join(" ");
}

function canonicalizeLogic(value: string) {
  return normalizeGeneralAnswer(value)
    .replace(/\bnot\b/g, "¬")
    .replace(/\band\b/g, "∧")
    .replace(/\bor\b/g, "∨")
    .replace(/\bimplies\b/g, "->")
    .replace(/\s+/g, "");
}

function tokenNearMatch(left: string, right: string) {
  if (left === right) {
    return true;
  }

  const leftTokens = left.split(" ").filter(Boolean);
  const rightTokens = right.split(" ").filter(Boolean);
  if (leftTokens.length !== rightTokens.length) {
    return false;
  }

  let mismatches = 0;
  for (let index = 0; index < leftTokens.length; index += 1) {
    if (leftTokens[index] !== rightTokens[index]) {
      mismatches += 1;
    }
  }

  return mismatches <= 1;
}

export function deterministicEquivalent(params: {
  userAnswer: string;
  correctAnswer: string;
  metadata?: QuestionGradingMetadata | null;
}) {
  const domain = params.metadata?.domain ?? "general";

  if (domain === "sql") {
    return canonicalizeSql(params.userAnswer) === canonicalizeSql(params.correctAnswer);
  }

  if (domain === "math") {
    return canonicalizeMath(params.userAnswer) === canonicalizeMath(params.correctAnswer);
  }

  if (domain === "logic") {
    return canonicalizeLogic(params.userAnswer) === canonicalizeLogic(params.correctAnswer);
  }

  if (domain === "relational_algebra") {
    const user = canonicalizeRelationalAlgebra(params.userAnswer);
    const correct = canonicalizeRelationalAlgebra(params.correctAnswer);
    return user === correct || tokenNearMatch(user, correct);
  }

  return false;
}
