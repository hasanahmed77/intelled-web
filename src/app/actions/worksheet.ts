"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consumeWorksheetCredit, refundWorksheetCredit } from "@/lib/billing/data";
import type { QuestionGradingMetadata } from "@/lib/grading/types";
import { fetchUserBadges } from "@/lib/gamification/data";
import { createNotificationsForAttempt } from "@/lib/notifications/data";
import { fetchProfile } from "@/lib/profile/data";
import { assertRateLimit } from "@/lib/security/rate-limit";
import {
  getMaxTotalAnswerCharacters,
  MAX_ANSWER_CHARACTERS
} from "@/lib/worksheet/limits";
import { generateWorksheet } from "@/lib/worksheet/generator";
import type { DifficultySelection } from "@/lib/worksheet/types";
import {
  createStaticWorksheetFromBank,
  createAttempt,
  fetchAttemptByWorksheet,
  fetchAttempts,
  fetchWorksheetAnswerKey,
  fetchWorksheetWithQuestions,
  getPerformanceDifficulty,
  getStaticTopicDifficulty,
  insertWorksheet
} from "@/lib/worksheet/data";
import { gradeAnswers, gradeStaticAnswers } from "@/lib/worksheet/grading";

const generateSchema = z.object({
  topic: z.string().min(4, "Add a more specific topic."),
  difficulty: z.enum(["easy", "medium", "hard", "auto"]),
  language: z.enum(["english", "bengali"])
});

export async function generateWorksheetsAction(formData: FormData) {
  const user = await requireUser();
  assertRateLimit({
    key: `ai-generate:${user.id}`,
    limit: 8,
    windowMs: 60_000,
    message: "Too many AI generation requests. Please wait a minute and try again."
  });
  const parsed = generateSchema.safeParse({
    topic: formData.get("topic"),
    difficulty: formData.get("difficulty"),
    language: formData.get("language")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { topic, difficulty, language } = parsed.data;
  const resolvedDifficulty =
    difficulty === "auto"
      ? await getPerformanceDifficulty(user.id)
      : (difficulty as Exclude<DifficultySelection, "auto">);

  let creditConsumed = false;

  try {
    const credit = await consumeWorksheetCredit(user.id, "ai");
    if (!credit.ok) {
      return {
        ok: false,
        error: credit.message ?? "Unable to generate worksheet."
      };
    }

    creditConsumed = true;
    const worksheet = await generateWorksheet(topic, resolvedDifficulty, language);
    const inserted = await insertWorksheet(user.id, worksheet);
    return { ok: true, worksheetId: inserted.id };
  } catch (error) {
    if (creditConsumed) {
      await refundWorksheetCredit(user.id, "ai");
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate worksheet."
    };
  }
}

const generateStaticSchema = z.object({
  educationType: z.string().min(1, "Choose an education type."),
  subject: z.string().min(1, "Choose a subject."),
  topic: z.string().min(1, "Choose a topic."),
  difficulty: z.enum(["easy", "medium", "hard", "auto"])
});

export async function generateStaticWorksheetAction(formData: FormData) {
  const user = await requireUser();
  assertRateLimit({
    key: `static-generate:${user.id}`,
    limit: 12,
    windowMs: 60_000,
    message: "Too many generation requests. Please wait a minute and try again."
  });
  const parsed = generateStaticSchema.safeParse({
    educationType: formData.get("educationType"),
    subject: formData.get("subject"),
    topic: formData.get("topic"),
    difficulty: formData.get("difficulty")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const resolvedDifficulty =
    parsed.data.difficulty === "auto"
      ? await getStaticTopicDifficulty({
          userId: user.id,
          educationType: parsed.data.educationType,
          subject: parsed.data.subject,
          topicKey: parsed.data.topic
        })
      : (parsed.data.difficulty as Exclude<DifficultySelection, "auto">);

  let creditConsumed = false;

  try {
    const credit = await consumeWorksheetCredit(user.id, "static");
    if (!credit.ok) {
      return {
        ok: false,
        error: credit.message ?? "Unable to create problem set."
      };
    }

    creditConsumed = true;
    const worksheet = await createStaticWorksheetFromBank({
      userId: user.id,
      educationType: parsed.data.educationType,
      subject: parsed.data.subject,
      topicKey: parsed.data.topic,
      difficulty: resolvedDifficulty
    });

    return { ok: true, worksheetId: worksheet.id };
  } catch (error) {
    if (creditConsumed) {
      await refundWorksheetCredit(user.id, "static");
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create problem set."
    };
  }
}

const submitSchema = z.object({
  worksheetId: z.string().uuid(),
  questions: z
    .array(
      z.object({
        index: z.number().int().min(1),
        userAnswer: z.preprocess(
          (val) => String(val ?? "").trim(),
          z
            .string()
            .min(1, "All questions must have an answer.")
            .max(
              MAX_ANSWER_CHARACTERS,
              `Each answer must be ${MAX_ANSWER_CHARACTERS} characters or fewer.`
            )
        )
      })
    )
    .min(1)
});

export async function submitAttemptAction(payload: {
  worksheetId: string;
  questions: { index: number; userAnswer: string }[];
}) {
  const user = await requireUser();
  assertRateLimit({
    key: `submit-attempt:${user.id}`,
    limit: 20,
    windowMs: 60_000,
    message: "Too many submissions in a short time. Please wait a minute and try again."
  });
  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Check your answers and try again."
    };
  }

  const totalAnswerCharacters = parsed.data.questions.reduce(
    (sum, question) => sum + question.userAnswer.length,
    0
  );
  const maxTotalAnswerCharacters = getMaxTotalAnswerCharacters(parsed.data.questions.length);

  if (totalAnswerCharacters > maxTotalAnswerCharacters) {
    return {
      ok: false,
      error: `Your submission is too long. Keep the total under ${maxTotalAnswerCharacters} characters.`
    };
  }

  const existingAttempt = await fetchAttemptByWorksheet(user.id, parsed.data.worksheetId);
  if (existingAttempt) {
    return {
      ok: false,
      error: "This problem set has already been submitted."
    };
  }

  const worksheet = await fetchWorksheetWithQuestions(user.id, parsed.data.worksheetId);
  if (!worksheet) {
    return {
      ok: false,
      error: "Problem set not found."
    };
  }

  const storedQuestions =
    (worksheet.questions as {
      id: string;
      prompt: string;
      order: number;
      grading?: QuestionGradingMetadata | null;
    }[] | null) ?? [];
  const indexedQuestions = new Map(storedQuestions.map((question) => [question.order, question]));

  if (parsed.data.questions.length !== storedQuestions.length) {
    return {
      ok: false,
      error: "Your submission does not match this problem set."
    };
  }

  const mergedQuestions = [];
  for (const question of parsed.data.questions) {
    const stored = indexedQuestions.get(question.index);
    if (!stored) {
      return {
        ok: false,
        error: "Your submission contains an invalid question."
      };
    }

    mergedQuestions.push({
      index: question.index,
      prompt: stored.prompt,
      userAnswer: question.userAnswer,
      grading: stored.grading ?? undefined
    });
  }

  let graded;
  try {
    if (worksheet.source === "static") {
      const answerKey = await fetchWorksheetAnswerKey(parsed.data.worksheetId);

      if (!answerKey || answerKey.length !== mergedQuestions.length) {
        return {
          ok: false,
          error: "The answer key for this problem set is missing."
        };
      }

      const indexedKey = new Map(answerKey.map((item) => [item.order, item]));
      graded = await gradeStaticAnswers({
        language: (worksheet.language as "english" | "bengali") ?? "english",
        questions: mergedQuestions.map((question) => {
          const answer = indexedKey.get(question.index);
          if (!answer) {
            throw new Error("The answer key for this problem set is incomplete.");
          }

          return {
            ...question,
            correctAnswer: answer.correctAnswer,
            feedback: answer.feedback
          };
        })
      });
    } else {
      graded = await gradeAnswers({
        language: (worksheet.language as "english" | "bengali") ?? "english",
        questions: mergedQuestions
      });
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "AI grading failed. Please try again."
    };
  }

  const correctCount = graded.filter((item) => item.isCorrect).length;
  const score = Math.round((correctCount / graded.length) * 100);

  const [beforeProfile, beforeAttempts, beforeBadges] = await Promise.all([
    fetchProfile(user.id),
    fetchAttempts(user.id),
    fetchUserBadges(user.id)
  ]);

  const result = await createAttempt({
    userId: user.id,
    worksheetId: parsed.data.worksheetId,
    difficulty: worksheet.difficulty as "easy" | "medium" | "hard",
    score,
    answers: graded.map((item) => ({
      index: item.index,
      prompt: item.prompt,
      userAnswer: item.userAnswer,
      feedback: item.feedback,
      isCorrect: item.isCorrect,
      correctAnswer: item.correctAnswer
    }))
  });

  const [afterProfile, afterAttempts, afterBadges] = await Promise.all([
    fetchProfile(user.id),
    fetchAttempts(user.id),
    fetchUserBadges(user.id)
  ]);

  await createNotificationsForAttempt({
    userId: user.id,
    beforeAttempts,
    afterAttempts,
    beforeLevel: beforeProfile?.level ?? 1,
    afterLevel: afterProfile?.level ?? 1,
    beforeBadgeIds: beforeBadges.map((badge) => badge.badge_id),
    afterBadgeIds: afterBadges.map((badge) => badge.badge_id)
  });

  revalidateTag("leaderboard", "max");

  return { ok: true, score: result.score, details: graded };
}
