import { z } from "zod";
import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:0.5b";

const worksheetSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.preprocess((val) => String(val ?? "").trim(), z.string().min(1))
    })
  )
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

async function callOllama(prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json"
    })
  });
  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.response) {
    throw new Error("Ollama response missing");
  }

  console.log("Ollama raw response:", data.response);
  return JSON.parse(data.response);
}

export async function generateWorksheetWithOllama(
  topic: string,
  difficulty: Difficulty
): Promise<GeneratedWorksheet> {
  const prompt = `You are generating a worksheet on any topic. Return ONLY valid JSON that matches this schema:
{
  "questions": [
    {"prompt": "string"}
  ]
}
 Rules:
 - Exactly 2 questions.
 - Difficulty: ${difficulty}.
 - Topic: ${topic}.
 - Each prompt must be a clear question about the topic.
 - Do NOT include answers or feedback.
 - Do NOT change the topic. Every question MUST be about the exact topic.
 - Avoid adding unrelated content.
`;

  const raw = await callOllama(prompt);
  const parsed = worksheetSchema.parse(raw);
  const questions = parsed.questions ?? [];
  if (questions.length < 2) {
    throw new Error(`Ollama returned ${questions.length} questions, expected 2.`);
  }

  return {
    title: topic,
    topic,
    difficulty,
    questions: questions.slice(0, 2).map((q, index) => ({
      id: crypto.randomUUID(),
      prompt: q.prompt,
      answer: "",
      feedback: "",
      order: index + 1
    }))
  };
}

export async function gradeWorksheetWithOllama(params: {
  questions: {
    index: number;
    prompt: string;
    userAnswer: string;
  }[];
}) {
  const prompt = `You are grading student answers. Return ONLY valid JSON with schema:
{
  "results": [
    {"index": 1, "isCorrect": true|false, "feedback": "string", "correctAnswer": "string"}
  ]
}
Rules:
- Judge correctness based ONLY on the question prompt and userAnswer.
- If correct, isCorrect = true. If not, false.
- Feedback may be empty ("") if no feedback is needed.
- If incorrect, provide a concise correct answer in correctAnswer.
- If correct, set correctAnswer to "".
- Use the provided index number for each question.
- Use ONLY the keys: index, isCorrect, feedback, correctAnswer.

Data:
${JSON.stringify(params.questions)}
`;

  const raw = await callOllama(prompt);
  const normalized = {
    ...raw,
    results: Array.isArray(raw?.results)
      ? raw.results.map((item: Record<string, unknown>, idx: number) => ({
          index:
            typeof item.index === "number"
              ? item.index
              : typeof item.idx === "number"
              ? item.idx
              : idx + 1,
          isCorrect:
            typeof item.isCorrect === "boolean"
              ? item.isCorrect
              : typeof item.isfalse === "boolean"
              ? !item.isfalse
              : Boolean(item.isCorrect),
          feedback: item.feedback ?? item.feedbacw ?? "",
          correctAnswer:
            item.correctAnswer ?? item.correctanswer ?? item.answer ?? ""
        }))
      : []
  };
  const parsed = gradingSchema.parse(normalized);
  const results = parsed.results.map((result) => {
    if (result.feedback.trim().length > 0) {
      return result;
    }
    return {
      ...result,
      feedback: result.isCorrect ? "Correct." : "Review the core concept and try again."
    };
  });

  const validIndexes = new Set(params.questions.map((q) => q.index));
  const invalid = results.filter((r) => !validIndexes.has(r.index));
  if (invalid.length > 0) {
    throw new Error("AI grading returned invalid results.");
  }

  return results;
}
