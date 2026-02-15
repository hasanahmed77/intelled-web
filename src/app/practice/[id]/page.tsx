import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fetchWorksheetWithQuestions } from "@/lib/worksheet/data";
import { WorksheetAttemptForm } from "@/components/worksheet-attempt-form";

export default async function WorksheetDetailPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireUser(`/practice/${params.id}`);
  const worksheet = await fetchWorksheetWithQuestions(user.id, params.id);

  if (!worksheet) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="tag">{worksheet.difficulty} difficulty</span>
        <h1 className="text-3xl font-semibold">{worksheet.title}</h1>
        <p className="text-muted">{worksheet.topic}</p>
      </div>
      <WorksheetAttemptForm
        worksheetId={worksheet.id}
        questions={[...(worksheet.worksheet_questions ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        )}
      />
    </div>
  );
}
