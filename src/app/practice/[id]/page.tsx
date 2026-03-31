import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchProfile } from "@/lib/profile/data";
import { fetchAttemptByWorksheet, fetchWorksheetWithQuestions } from "@/lib/worksheet/data";
import { WorksheetAttemptForm } from "@/components/worksheet-attempt-form";
import { ViewportSection } from "@/components/viewport-section";

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export default async function WorksheetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/practice/${id}`);
  const fallbackName = (user.email ?? "user").split("@")[0];
  const [worksheet, attempt, profile] = await Promise.all([
    fetchWorksheetWithQuestions(user.id, id),
    fetchAttemptByWorksheet(user.id, id),
    fetchProfile(user.id)
  ]);
  const displayName = profile?.full_name?.trim() || fallbackName;

  if (!worksheet) {
    notFound();
  }

  const questions = (worksheet.questions as { id: string; prompt: string; order: number }[] | null) ?? [];
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const savedAnswers = (attempt?.answers as {
    index: number;
    userAnswer: string;
    feedback: string;
    isCorrect: boolean;
    correctAnswer?: string;
  }[] | null) ?? [];

  const initialAnswers = Object.fromEntries(
    sortedQuestions.map((question) => {
      const match = savedAnswers.find((item) => item.index === question.order);
      return [question.id, match?.userAnswer ?? ""];
    })
  );

  const initialResult = attempt
    ? {
        score: attempt.score,
        details: sortedQuestions.map((question) => {
          const match = savedAnswers.find((item) => item.index === question.order);
          return {
            index: question.order,
            isCorrect: match?.isCorrect ?? false,
            feedback: match?.feedback ?? "",
            correctAnswer: match?.correctAnswer ?? ""
          };
        })
      }
    : null;

  return (
    <ViewportSection innerClassName="space-y-8">
      <div className="space-y-2">
        <span className="tag">{worksheet.difficulty} difficulty</span>
        <h1 className="text-3xl font-semibold">{toTitleCase(worksheet.title)}</h1>
        <p className="text-muted">{worksheet.topic}</p>
      </div>
      <WorksheetAttemptForm
        worksheetId={worksheet.id}
        difficulty={worksheet.difficulty}
        language={worksheet.language ?? "english"}
        username={displayName}
        questions={sortedQuestions}
        submitted={Boolean(attempt)}
        initialAnswers={initialAnswers}
        initialResult={initialResult}
      />
    </ViewportSection>
  );
}
