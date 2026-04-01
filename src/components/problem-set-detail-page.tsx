import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchProfile } from "@/lib/profile/data";
import { fetchAttemptByWorksheet, fetchWorksheetWithQuestions } from "@/lib/worksheet/data";
import { WorksheetAttemptForm } from "@/components/worksheet-attempt-form";
import { ViewportSection } from "@/components/viewport-section";
import type { WorksheetSource } from "@/lib/worksheet/types";
import type { QuestionDiagram } from "@/lib/worksheet/types";

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function getDisplayTitle(params: {
  expectedSource: WorksheetSource;
  title: string;
  topic: string | null;
}) {
  if (params.expectedSource === "static") {
    if (params.topic) {
      return toTitleCase(params.topic);
    }

    const [, staticTopic = params.title] = params.title.split(":");
    return toTitleCase(staticTopic.trim());
  }

  return toTitleCase(params.title);
}

export async function ProblemSetDetailPage({
  worksheetId,
  expectedSource,
  redirectBasePath
}: {
  worksheetId: string;
  expectedSource: WorksheetSource;
  redirectBasePath: string;
}) {
  const user = await requireUser(redirectBasePath);
  const fallbackName = (user.email ?? "user").split("@")[0];
  const [worksheet, attempt, profile] = await Promise.all([
    fetchWorksheetWithQuestions(user.id, worksheetId),
    fetchAttemptByWorksheet(user.id, worksheetId),
    fetchProfile(user.id)
  ]);
  const displayName = profile?.full_name?.trim() || fallbackName;

  if (!worksheet || worksheet.source !== expectedSource) {
    notFound();
  }

  const questions =
    (worksheet.questions as { id: string; prompt: string; order: number; diagram?: QuestionDiagram | null }[] | null) ?? [];
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const savedAnswers =
    (attempt?.answers as {
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

  const badgeLabel =
    expectedSource === "static"
      ? `${worksheet.subject ?? "Static"} • ${worksheet.education_type ?? "Problem Set"}`
      : `${worksheet.difficulty} difficulty`;

  return (
    <ViewportSection innerClassName="space-y-8">
      <div className="space-y-2">
        <span className="tag">{badgeLabel}</span>
        <h1 className="text-3xl font-semibold">
          {getDisplayTitle({
            expectedSource,
            title: worksheet.title,
            topic: worksheet.topic
          })}
        </h1>
      </div>
      <WorksheetAttemptForm
        worksheetId={worksheet.id}
        username={displayName}
        questions={sortedQuestions}
        submitted={Boolean(attempt)}
        initialAnswers={initialAnswers}
        initialResult={initialResult}
      />
    </ViewportSection>
  );
}
