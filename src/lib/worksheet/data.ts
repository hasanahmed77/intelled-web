import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Difficulty,
  GeneratedWorksheet,
  StaticQuestionBankItem
} from "@/lib/worksheet/types";

export type StaticOption = {
  educationType: string;
  subject: string;
  topic: string;
};

export type SubjectCatalogEntry = {
  educationType: string;
  subject: string;
  label: string;
  sortOrder: number;
};

export type TopicCatalogEntry = {
  educationType: string;
  subject: string;
  topic: string;
  label: string;
  sortOrder: number;
};

export type StaticPracticeCatalog = {
  options: StaticOption[];
  subjectCatalog: SubjectCatalogEntry[];
  topicCatalog: TopicCatalogEntry[];
};

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
      source: worksheet.source,
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

export async function listStaticQuestionBankOptions(): Promise<StaticPracticeCatalog> {
  const supabase = createSupabaseAdminClient();
  const [
    { data: optionRows, error: optionError },
    { data: subjectCatalogRows, error: subjectCatalogError },
    { data: topicCatalogRows, error: topicCatalogError }
  ] = await Promise.all([
    supabase
      .from("static_question_sets")
      .select("education_type, subject, topic")
      .eq("active", true)
      .order("education_type", { ascending: true })
      .order("subject", { ascending: true })
      .order("topic", { ascending: true }),
    supabase
      .from("curriculum_subjects")
      .select("education_type, subject, display_label, sort_order")
      .eq("show_in_picker", true)
      .order("education_type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("display_label", { ascending: true }),
    supabase
      .from("curriculum_topics")
      .select("education_type, subject, topic, display_label, sort_order")
      .eq("show_in_picker", true)
      .order("education_type", { ascending: true })
      .order("subject", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("display_label", { ascending: true })
  ]);

  if (optionError) throw new Error(optionError.message);
  if (subjectCatalogError) throw new Error(subjectCatalogError.message);
  if (topicCatalogError) throw new Error(topicCatalogError.message);

  return {
    options: (optionRows ?? []).map((row) => ({
      educationType: row.education_type as string,
      subject: row.subject as string,
      topic: row.topic as string
    })),
    subjectCatalog: (subjectCatalogRows ?? []).map((row) => ({
      educationType: row.education_type as string,
      subject: row.subject as string,
      label: row.display_label as string,
      sortOrder: row.sort_order as number
    })),
    topicCatalog: (topicCatalogRows ?? []).map((row) => ({
      educationType: row.education_type as string,
      subject: row.subject as string,
      topic: row.topic as string,
      label: row.display_label as string,
      sortOrder: row.sort_order as number
    }))
  };
}

export async function createStaticWorksheetFromBank(params: {
  userId: string;
  educationType: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: bankSets, error } = await supabase
    .from("static_question_sets")
    .select("id, education_type, subject, topic, difficulty, language, variant_index, questions")
    .eq("education_type", params.educationType)
    .eq("subject", params.subject)
    .eq("topic", params.topic)
    .eq("difficulty", params.difficulty)
    .eq("active", true)
    .order("variant_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const variants = (bankSets ?? []) as Array<{
    id: string;
    education_type: string;
    subject: string;
    topic: string;
    difficulty: Difficulty;
    language: "english" | "bengali";
    variant_index: number;
    questions: StaticQuestionBankItem[];
  }>;

  if (variants.length === 0) {
    throw new Error("No matching curated problem set was found for that difficulty.");
  }

  const { data: progress, error: progressError } = await supabase
    .from("user_static_topic_progress")
    .select("next_variant_index")
    .eq("user_id", params.userId)
    .eq("education_type", params.educationType)
    .eq("subject", params.subject)
    .eq("topic", params.topic)
    .eq("language", variants[0].language)
    .eq("difficulty", params.difficulty)
    .maybeSingle();

  if (progressError) {
    throw new Error(progressError.message);
  }

  const requestedVariantIndex = progress?.next_variant_index ?? variants[0].variant_index;
  const bankSet =
    variants.find((variant) => variant.variant_index === requestedVariantIndex) ?? variants[0];
  const currentVariantPosition = variants.findIndex((variant) => variant.id === bankSet.id);
  const nextVariant =
    variants[(currentVariantPosition + 1) % variants.length] ?? variants[0];

  const questions = ((bankSet.questions as StaticQuestionBankItem[] | null) ?? []).map(
    (question, index) => ({
      id: crypto.randomUUID(),
      prompt: question.prompt,
      diagram: question.diagram ?? null,
      order: index + 1
    })
  );

  if (questions.length === 0) {
    throw new Error("The selected curated problem set has no questions.");
  }

  const progressUpsert = await supabase.from("user_static_topic_progress").upsert({
    user_id: params.userId,
    education_type: params.educationType,
    subject: params.subject,
    topic: params.topic,
    language: bankSet.language,
    difficulty: params.difficulty,
    next_variant_index: nextVariant.variant_index
  });

  if (progressUpsert.error) {
    throw new Error(progressUpsert.error.message);
  }

  const appSupabase = await createSupabaseServerClient();
  const { data: worksheetRow, error: worksheetError } = await appSupabase
    .from("worksheets")
    .insert({
      user_id: params.userId,
      title: `${bankSet.subject}: ${bankSet.topic}`,
      topic: bankSet.topic,
      education_type: bankSet.education_type,
      subject: bankSet.subject,
      difficulty: bankSet.difficulty ?? "medium",
      language: bankSet.language ?? "english",
      source: "static",
      questions
    })
    .select("id")
    .single();

  if (worksheetError || !worksheetRow) {
    throw new Error(worksheetError?.message ?? "Failed to create curated problem set");
  }

  const answerKeyQuestions = ((bankSet.questions as StaticQuestionBankItem[] | null) ?? []).map(
    (question, index) => ({
      order: index + 1,
      correctAnswer: question.correctAnswer,
      feedback: question.feedback
    })
  );

  const { error: answerKeyError } = await supabase.from("worksheet_answer_keys").insert({
    worksheet_id: worksheetRow.id,
    source_set_id: bankSet.id,
    questions: answerKeyQuestions
  });

  if (answerKeyError) {
    await appSupabase.from("worksheets").delete().eq("id", worksheetRow.id).eq("user_id", params.userId);
    throw new Error(answerKeyError.message);
  }

  return worksheetRow;
}

export async function fetchWorksheets(userId: string, limit = 10, offset = 0) {
  const supabase = await createSupabaseServerClient();
  const { data, count } = await supabase
    .from("worksheets")
    .select("id, title, topic, difficulty, language, source, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data ?? [], total: count ?? 0 };
}

export async function fetchWorksheetWithQuestions(userId: string, worksheetId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("worksheets")
    .select("id, title, topic, education_type, subject, difficulty, language, source, questions")
    .eq("id", worksheetId)
    .eq("user_id", userId)
    .single();

  return data;
}

export async function fetchWorksheetAnswerKey(worksheetId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("worksheet_answer_keys")
    .select("questions")
    .eq("worksheet_id", worksheetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.questions as
    | { order: number; correctAnswer: string; feedback: string }[]
    | null) ?? null;
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
    .select("id, worksheet_id, score, created_at, difficulty_used, worksheets(title, topic, source)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
