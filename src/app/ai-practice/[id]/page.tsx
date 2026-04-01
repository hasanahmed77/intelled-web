import { ProblemSetDetailPage } from "@/components/problem-set-detail-page";

export default async function AiProblemSetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProblemSetDetailPage
      worksheetId={id}
      expectedSource="ai"
      redirectBasePath={`/ai-practice/${id}`}
    />
  );
}
