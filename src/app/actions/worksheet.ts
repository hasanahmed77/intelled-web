"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generateWorksheet } from "@/lib/worksheet/generator";
import type { DifficultySelection } from "@/lib/worksheet/types";
import {
  createAttempt,
  fetchWorksheetWithQuestions,
  getPerformanceDifficulty,
  insertWorksheet
} from "@/lib/worksheet/data";

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
    const worksheet = generateWorksheet(topic, resolvedDifficulty);
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
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        answer: z.string().min(1)
      })
    )
    .min(1)
});

export async function submitAttemptAction(payload: {
  worksheetId: string;
  answers: { questionId: string; answer: string }[];
}) {
  const user = await requireUser();
  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Check your answers and try again." };
  }

  const worksheet = await fetchWorksheetWithQuestions(user.id, payload.worksheetId);
  if (!worksheet || !worksheet.questions) {
    return { ok: false, error: "Worksheet not found." };
  }

  const answersWithKeys = parsed.data.answers.map((answer) => {
    const question = (worksheet.questions as { id: string; prompt: string; answer: string; feedback: string }[]).find(
      (item) => item.id === answer.questionId
    );
    return {
      questionId: answer.questionId,
      answer: answer.answer,
      correctAnswer: question?.answer ?? "",
      feedback: question?.feedback ?? "Review the working and try again.",
      prompt: question?.prompt ?? ""
    };
  });

  const result = await createAttempt({
    userId: user.id,
    worksheetId: worksheet.id,
    difficulty: worksheet.difficulty,
    answers: answersWithKeys
  });

  const details = answersWithKeys.map((answer) => ({
    questionId: answer.questionId,
    isCorrect:
      answer.answer.trim().toLowerCase() === answer.correctAnswer.trim().toLowerCase(),
    feedback: answer.feedback,
    correctAnswer: answer.correctAnswer
  }));

  return { ok: true, score: result.score, details };
}
