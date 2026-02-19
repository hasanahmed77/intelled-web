import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchWorksheetWithQuestions } from "@/lib/worksheet/data";
import { WorksheetAttemptForm } from "@/components/worksheet-attempt-form";

export default async function WorksheetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/practice/${id}`);
  const worksheet = await fetchWorksheetWithQuestions(user.id, id);

  if (!worksheet) {
    notFound();
  }

  const questions = (worksheet.questions as { id: string; prompt: string; order: number }[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="tag">{worksheet.difficulty} difficulty</span>
        <h1 className="text-3xl font-semibold">{worksheet.title}</h1>
        <p className="text-muted">{worksheet.topic}</p>
      </div>
      <WorksheetAttemptForm
        worksheetId={worksheet.id}
        difficulty={worksheet.difficulty}
        questions={[...questions].sort((a, b) => a.order - b.order)}
      />
    </div>
  );
}
