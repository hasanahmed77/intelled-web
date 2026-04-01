import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";

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
      language: worksheet.language,
      questions: worksheet.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        order: q.order
      }))
    })
    .select("id, title, topic, difficulty, language, questions")
    .single();

  if (error || !worksheetRow) {
    throw new Error(error?.message ?? "Failed to create problem set");
  }

  return worksheetRow;
}

export async function fetchWorksheets(userId: string, limit = 10, offset = 0) {
  const supabase = await createSupabaseServerClient();
  const { data, count } = await supabase
    .from("worksheets")
    .select("id, title, topic, difficulty, language, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data ?? [], total: count ?? 0 };
}

export async function fetchWorksheetWithQuestions(userId: string, worksheetId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheets")
    .select("id, title, topic, difficulty, language, questions")
    .eq("id", worksheetId)
    .eq("user_id", userId)
    .single();

  return data;
}

export async function fetchAttemptByWorksheet(userId: string, worksheetId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheet_attempts")
    .select("id, score, answers, created_at")
    .eq("user_id", userId)
    .eq("worksheet_id", worksheetId)
    .maybeSingle();

  return data;
}

export async function createAttempt(params: {
  userId: string;
  worksheetId: string;
  difficulty: Difficulty;
  score: number;
  answers: {
    index: number;
    prompt: string;
    userAnswer: string;
    feedback: string;
    isCorrect: boolean;
    correctAnswer: string;
  }[];
}) {
  const supabase = await createSupabaseServerClient();

  const { data: attempt, error } = await supabase
    .from("worksheet_attempts")
    .insert({
      user_id: params.userId,
      worksheet_id: params.worksheetId,
      score: params.score,
      difficulty_used: params.difficulty,
      answers: params.answers.map((answer) => ({
        index: answer.index,
        prompt: answer.prompt,
        userAnswer: answer.userAnswer,
        feedback: answer.feedback,
        isCorrect: answer.isCorrect,
        correctAnswer: answer.correctAnswer
      }))
    })
    .select("id, score, answers")
    .single();

  if (error || !attempt) {
    if (error?.code === "23505") {
      throw new Error("This problem set has already been submitted.");
    }
    throw new Error(error?.message ?? "Failed to create attempt");
  }

  return { attemptId: attempt.id, score: attempt.score };
}

export async function fetchAttempts(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheet_attempts")
    .select("id, worksheet_id, score, created_at, difficulty_used, worksheets(title, topic)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
