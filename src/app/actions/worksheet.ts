"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generateWorksheet } from "@/lib/worksheet/generator";
import type { DifficultySelection } from "@/lib/worksheet/types";
import {
  createAttempt,
  getPerformanceDifficulty,
  insertWorksheet
} from "@/lib/worksheet/data";
import { gradeAnswers } from "@/lib/worksheet/grading";

const generateSchema = z.object({
  topic: z.string().min(4, "Add a more specific topic."),
  difficulty: z.enum(["easy", "medium", "hard", "auto"])
});

export async function generateWorksheetsAction(formData: FormData) {
  const user = await requireUser();
  const parsed = generateSchema.safeParse({
    topic: formData.get("topic"),
    difficulty: formData.get("difficulty")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { topic, difficulty } = parsed.data;
  const resolvedDifficulty =
    difficulty === "auto"
      ? await getPerformanceDifficulty(user.id)
      : (difficulty as Exclude<DifficultySelection, "auto">);

  try {
    const worksheet = await generateWorksheet(topic, resolvedDifficulty);
    const inserted = await insertWorksheet(user.id, worksheet);
    return { ok: true, worksheetId: inserted.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate worksheet."
    };
  }
}

const submitSchema = z.object({
  worksheetId: z.string().uuid(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z
    .array(
      z.object({
        index: z.number().int().min(1),
        prompt: z.string().min(1),
        userAnswer: z.preprocess(
          (val) => String(val ?? "").trim(),
          z.string().min(1, "All questions must have an answer.")
        )
      })
    )
    .min(1)
});

export async function submitAttemptAction(payload: {
  worksheetId: string;
  difficulty: "easy" | "medium" | "hard";
  questions: { index: number; prompt: string; userAnswer: string }[];
}) {
  const user = await requireUser();
  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Check your answers and try again."
    };
  }

  let graded;
  try {
    graded = await gradeAnswers({ questions: parsed.data.questions });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "AI grading failed. Please try again."
    };
  }

  const correctCount = graded.filter((item) => item.isCorrect).length;
  const score = Math.round((correctCount / graded.length) * 100);

  const result = await createAttempt({
    userId: user.id,
    worksheetId: parsed.data.worksheetId,
    difficulty: parsed.data.difficulty,
    score,
    answers: graded.map((item) => ({
      index: item.index,
      prompt: item.prompt,
      userAnswer: item.userAnswer,
      feedback: item.feedback,
      isCorrect: item.isCorrect
    }))
  });

  return { ok: true, score: result.score, details: graded };
}
