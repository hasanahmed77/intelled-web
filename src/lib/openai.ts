import { z } from "zod";
import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TIMEOUT_MS = 30000;

function parseOptionalNumber(value: string | undefined) {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const OPENAI_INPUT_COST_PER_1M = parseOptionalNumber(process.env.OPENAI_INPUT_COST_PER_1M);
const OPENAI_OUTPUT_COST_PER_1M = parseOptionalNumber(process.env.OPENAI_OUTPUT_COST_PER_1M);

const worksheetSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.preprocess((val) => String(val ?? "").trim(), z.string().min(1))
    })
  ).length(1)
});

const gradingSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int().min(1),
      isCorrect: z.boolean(),
      feedback: z.preprocess((val) => String(val ?? "").trim(), z.string()),
      correctAnswer: z.preprocess((val) => String(val ?? "").trim(), z.string())
    })
  )
});

function assertOpenAIConfig() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
}

function isRetriableStatus(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractMessageContent(messageContent: unknown) {
  if (typeof messageContent === "string") {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: unknown }).type === "text" &&
          "text" in part
        ) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }

  return String(messageContent ?? "");
}

function maybeExtractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalizeMathArtifacts(text: string) {
  return text
    .replace(/\u000c/g, "\\f")
    .replace(/\u0008/g, "\\b")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n");
}

function sanitizeStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return normalizeMathArtifacts(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeStrings(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeStrings(val)])
    );
  }
  return value;
}

function normalizeWorksheetPrompt(prompt: string) {
  return normalizeMathArtifacts(prompt)
    .replace(/\\\[/g, "\\(")
    .replace(/\\\]/g, "\\)")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function resolveModelPricing(model: string) {
  if (OPENAI_INPUT_COST_PER_1M !== null && OPENAI_OUTPUT_COST_PER_1M !== null) {
    return {
      inputPer1M: OPENAI_INPUT_COST_PER_1M,
      outputPer1M: OPENAI_OUTPUT_COST_PER_1M,
      source: "env_override"
    };
  }

  const known: Record<string, { inputPer1M: number; outputPer1M: number }> = {
    "gpt-5-mini": { inputPer1M: 0.25, outputPer1M: 2.0 },
    "gpt-5.4": { inputPer1M: 2.5, outputPer1M: 15.0 }
  };

  if (known[model]) {
    return { ...known[model], source: "built_in_map" };
  }

  return {
    inputPer1M: 0,
    outputPer1M: 0,
    source: "unknown_model"
  };
}

function extractUsage(usage: Record<string, unknown> | undefined) {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  const inputTokens =
    typeof usage.input_tokens === "number"
      ? usage.input_tokens
      : typeof usage.prompt_tokens === "number"
      ? usage.prompt_tokens
      : 0;

  const outputTokens =
    typeof usage.output_tokens === "number"
      ? usage.output_tokens
      : typeof usage.completion_tokens === "number"
      ? usage.completion_tokens
      : 0;

  const totalTokens =
    typeof usage.total_tokens === "number" ? usage.total_tokens : inputTokens + outputTokens;

  return { inputTokens, outputTokens, totalTokens };
}

function estimateUsdCost(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const pricing = resolveModelPricing(params.model);
  if (pricing.inputPer1M <= 0 && pricing.outputPer1M <= 0) {
    return { estimatedUsd: null as number | null, pricingSource: pricing.source };
  }

  const inputUsd = (params.inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputUsd = (params.outputTokens / 1_000_000) * pricing.outputPer1M;
  return {
    estimatedUsd: inputUsd + outputUsd,
    pricingSource: pricing.source
  };
}

async function callOpenAIJson(params: {
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
}) {
  assertOpenAIConfig();

  const body = {
    model: OPENAI_MODEL,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: params.schemaName,
        strict: true,
        schema: params.schema
      }
    },
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user }
    ]
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        signal: controller.signal,
        body: JSON.stringify(body)
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        if (isRetriableStatus(response.status) && attempt < 2) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        throw new Error(`OpenAI error: ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      const usage = extractUsage(data?.usage);
      const cost = estimateUsdCost({
        model: OPENAI_MODEL,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      });
      console.log(
        "[OpenAI Usage]",
        JSON.stringify({
          operation: params.schemaName,
          model: OPENAI_MODEL,
          requestId: data?.id ?? null,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          estimatedUsd: cost.estimatedUsd,
          pricingSource: cost.pricingSource
        })
      );
      const content = extractMessageContent(data?.choices?.[0]?.message?.content);
      const jsonText = maybeExtractJson(content);
      const parsedOutput = JSON.parse(jsonText);
      const sanitizedOutput = sanitizeStrings(parsedOutput);
      console.log(
        "[OpenAI Output]",
        JSON.stringify({
          operation: params.schemaName,
          model: OPENAI_MODEL,
          requestId: data?.id ?? null,
          output: sanitizedOutput
        })
      );
      return sanitizedOutput;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 2) {
        await sleep(300 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error("OpenAI request failed.");
}

export async function generateWorksheetWithOpenAI(
  topic: string,
  difficulty: Difficulty
): Promise<GeneratedWorksheet> {
  const raw = await callOpenAIJson({
    schemaName: "worksheet_generation",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          minItems: 1,
          maxItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["prompt"],
            properties: {
              prompt: { type: "string", minLength: 1 }
            }
          }
        }
      }
    },
    system: "You generate concise, high-quality worksheet questions. Output must follow the required JSON schema exactly.",
    user: `Create exactly 1 worksheet question.
Topic: ${topic}
Difficulty: ${difficulty}
Rules:
- The question must be directly about the topic
- The question must be written as a single clean paragraph, not bullets or multiple lines
- For mathematical notation, use inline LaTeX only: \\( ... \\)
- Never use display/block LaTeX: \\[ ... \\]
- Return JSON only`
  });

  const parsed = worksheetSchema.parse(raw);

  return {
    title: topic,
    topic,
    difficulty,
    questions: parsed.questions.map((q, index) => ({
      id: crypto.randomUUID(),
      prompt: normalizeWorksheetPrompt(q.prompt),
      answer: "",
      feedback: "",
      order: index + 1
    }))
  };
}

export async function gradeWorksheetWithOpenAI(params: {
  questions: {
    index: number;
    prompt: string;
    userAnswer: string;
  }[];
}) {
  const raw = await callOpenAIJson({
    schemaName: "worksheet_grading",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["results"],
      properties: {
        results: {
          type: "array",
          minItems: params.questions.length,
          maxItems: params.questions.length,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["index", "isCorrect", "feedback", "correctAnswer"],
            properties: {
              index: { type: "integer", minimum: 1 },
              isCorrect: { type: "boolean" },
              feedback: { type: "string" },
              correctAnswer: { type: "string" }
            }
          }
        }
      }
    },
    system:
      "You are a strict but fair grader. Evaluate each answer using the question prompt and user answer only.",
    user: `Grade each answer and return valid JSON.
Rules:
- Preserve each original index
- If correct: isCorrect=true, feedback="", correctAnswer=""
- If incorrect: isCorrect=false, feedback may be brief, correctAnswer must contain a concise correct answer
- For any mathematical notation in feedback or correctAnswer, use LaTeX delimiters: inline \\( ... \\), block \\[ ... \\]
- Return JSON only

Data:
${JSON.stringify(params.questions)}`
  });

  const parsed = gradingSchema.parse(raw);
  const validIndexes = new Set(params.questions.map((q) => q.index));

  if (parsed.results.length !== params.questions.length) {
    throw new Error("AI grading returned incomplete results.");
  }

  const invalid = parsed.results.filter((item) => !validIndexes.has(item.index));
  if (invalid.length > 0) {
    throw new Error("AI grading returned invalid indexes.");
  }

  return parsed.results;
}
