import { deterministicEquivalent } from "@/lib/grading/graders";
import type { QuestionGradingMetadata } from "@/lib/grading/types";

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

export function normalizeGeneralAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "/")
    .replace(/\\geq|\\ge/g, ">=")
    .replace(/\\leq|\\le/g, "<=")
    .replace(/\\neq/g, "!=")
    .replace(/\\to|\\rightarrow/g, "->")
    .replace(/\\land/g, "and")
    .replace(/\\lor/g, "or")
    .replace(/\\pi\b/g, "π")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\bprojection\b/g, "π")
    .replace(/\bproj\b/g, "π")
    .replace(/\bpi\b/g, "π")
    .replace(/\bselection\b/g, "σ")
    .replace(/\bselect\b/g, "σ")
    .replace(/\bsigma\b/g, "σ")
    .replace(/\bcartesian product\b/g, "×")
    .replace(/\bcross product\b/g, "×")
    .replace(/\btheta join\b/g, "⨝")
    .replace(/[∗⋅]/g, "*")
    .replace(/[−–—]/g, "-")
    .replace(/[×✕✖]/g, "×")
    .replace(/\sx\s/g, " × ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSymbolic(value: string) {
  return normalizeGeneralAnswer(value)
    .replace(/([(),.=<>*+/\-×⨝πσ])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[a-z0-9_.]+$/.test(token)) {
        return normalizeIdentifier(token);
      }
      return token;
    });
}

export function areAnswersEquivalent(params: {
  userAnswer: string;
  correctAnswer: string;
  metadata?: QuestionGradingMetadata | null;
}) {
  const user = normalizeGeneralAnswer(params.userAnswer);
  const correct = normalizeGeneralAnswer(params.correctAnswer);

  if (!user || !correct) {
    return false;
  }

  if (user === correct) {
    return true;
  }

  if (deterministicEquivalent(params)) {
    return true;
  }

  const answerKind = params.metadata?.answerKind ?? "short_text";
  if (answerKind === "free_text") {
    return false;
  }

  if (answerKind === "symbolic_expression" || answerKind === "formula" || answerKind === "code") {
    const userTokens = tokenizeSymbolic(params.userAnswer);
    const correctTokens = tokenizeSymbolic(params.correctAnswer);
    if (userTokens.join(" ") === correctTokens.join(" ")) {
      return true;
    }

    if (userTokens.length === correctTokens.length) {
      let mismatchCount = 0;
      for (let index = 0; index < userTokens.length; index += 1) {
        if (userTokens[index] !== correctTokens[index]) {
          mismatchCount += 1;
        }
      }
      return mismatchCount <= 1;
    }
  }

  return false;
}
