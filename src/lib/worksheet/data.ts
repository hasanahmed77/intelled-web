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

export async function insertWorksheets(userId: string, worksheets: GeneratedWorksheet[]) {
  const supabase = await createSupabaseServerClient();

  const { data: worksheetRows, error } = await supabase
    .from("worksheets")
    .insert(
      worksheets.map((worksheet) => ({
        user_id: userId,
        title: worksheet.title,
        topic: worksheet.topic,
        difficulty: worksheet.difficulty
      }))
    )
    .select("id, title, topic, difficulty");

  if (error || !worksheetRows) {
    throw new Error(error?.message ?? "Failed to create worksheets");
  }

  const questionsPayload = worksheetRows.flatMap((row, index) => {
    const worksheet = worksheets[index];
    return worksheet.questions.map((question) => ({
      worksheet_id: row.id,
      prompt: question.prompt,
      answer: question.answer,
      feedback: question.feedback,
      order_index: question.order
    }));
  });

  const { error: questionError } = await supabase
    .from("worksheet_questions")
    .insert(questionsPayload);

  if (questionError) {
    throw new Error(questionError.message);
  }

  return worksheetRows;
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
    .select(
      "id, title, topic, difficulty, worksheet_questions(id, prompt, answer, feedback, order_index)"
    )
    .eq("id", worksheetId)
    .eq("user_id", userId)
    .single();

  return data;
}

export async function createAttempt(params: {
  userId: string;
  worksheetId: string;
  difficulty: Difficulty;
  answers: { questionId: string; answer: string; correctAnswer: string; feedback: string }[];
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
      difficulty_used: params.difficulty
    })
    .select("id, score")
    .single();

  if (error || !attempt) {
    throw new Error(error?.message ?? "Failed to create attempt");
  }

  const answersPayload = params.answers.map((answer) => ({
    attempt_id: attempt.id,
    question_id: answer.questionId,
    user_answer: answer.answer,
    is_correct: answer.answer.trim().toLowerCase() === answer.correctAnswer.trim().toLowerCase(),
    feedback: answer.feedback
  }));

  const { error: answersError } = await supabase
    .from("attempt_answers")
    .insert(answersPayload);

  if (answersError) {
    throw new Error(answersError.message);
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
