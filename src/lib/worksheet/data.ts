import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Difficulty, GeneratedQuestion, GeneratedWorksheet } from "@/lib/worksheet/types";

export async function getPerformanceDifficulty(userId: string): Promise<Difficulty> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheet_attempts")
    .select("score")
    .eq("user_id", userId);

  if (!data || data.length === 0) {
    return "medium";
  }

  const avg = data.reduce((sum, row) => sum + (row.score ?? 0), 0) / data.length;
  if (avg >= 80) return "hard";
  if (avg >= 50) return "medium";
  return "easy";
}

export async function insertWorksheet(userId: string, worksheet: GeneratedWorksheet) {
  const supabase = await createSupabaseServerClient();

  const { data: worksheetRow, error } = await supabase
    .from("worksheets")
    .insert({
      user_id: userId,
      title: worksheet.title,
      topic: worksheet.topic,
      difficulty: worksheet.difficulty,
      questions: worksheet.questions
    })
    .select("id, title, topic, difficulty, questions")
    .single();

  if (error || !worksheetRow) {
    throw new Error(error?.message ?? "Failed to create worksheets");
  }

  return worksheetRow;
}

export async function fetchWorksheets(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheets")
    .select("id, title, topic, difficulty, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function fetchWorksheetWithQuestions(userId: string, worksheetId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheets")
    .select("id, title, topic, difficulty, questions")
    .eq("id", worksheetId)
    .single();

  return data;
}

export async function createAttempt(params: {
  userId: string;
  worksheetId: string;
  difficulty: Difficulty;
  answers: {
    questionId: string;
    answer: string;
    correctAnswer: string;
    feedback: string;
    prompt: string;
  }[];
}) {
  const supabase = await createSupabaseServerClient();
  const correctCount = params.answers.filter(
    (answer) => answer.answer.trim().toLowerCase() === answer.correctAnswer.trim().toLowerCase()
  ).length;
  const score = Math.round((correctCount / params.answers.length) * 100);

  const { data: attempt, error } = await supabase
    .from("worksheet_attempts")
    .insert({
      user_id: params.userId,
      worksheet_id: params.worksheetId,
      score,
      difficulty_used: params.difficulty,
      answers: params.answers.map((answer) => ({
        questionId: answer.questionId,
        prompt: answer.prompt,
        userAnswer: answer.answer,
        correctAnswer: answer.correctAnswer,
        feedback: answer.feedback,
        isCorrect:
          answer.answer.trim().toLowerCase() === answer.correctAnswer.trim().toLowerCase()
      }))
    })
    .select("id, score, answers")
    .single();

  if (error || !attempt) {
    throw new Error(error?.message ?? "Failed to create attempt");
  }

  return { attemptId: attempt.id, score };
}

export async function fetchAttempts(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheet_attempts")
    .select(
      "id, score, created_at, difficulty_used, worksheets(title, topic)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
