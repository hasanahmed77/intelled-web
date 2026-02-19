import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fetchWorksheets } from "@/lib/worksheet/data";
import { PracticeForm } from "@/components/practice-form";

export default async function PracticePage() {
  const user = await requireUser("/practice");
  const worksheets = await fetchWorksheets(user.id);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="tag">Practice</span>
        <h1 className="text-3xl font-semibold">Generate your next worksheet.</h1>
        <p className="text-muted">
          Enter a topic and choose a difficulty. Auto uses your performance history to
          tune the worksheet level.
        </p>
      </div>

      <PracticeForm />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your recent worksheets</h2>
          <span className="text-sm text-muted">{worksheets.length} total</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {worksheets.map((worksheet) => (
            <Link
              key={worksheet.id}
              className="card p-5 transition hover:border-accent"
              href={`/practice/${worksheet.id}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{worksheet.topic}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-muted">
                  {worksheet.difficulty}
                </span>
              </div>
              <p className="mt-4 text-xs text-muted">Created {new Date(worksheet.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
          {worksheets.length === 0 ? (
            <div className="card p-6 text-sm text-muted">
              No worksheets yet. Generate your first set above.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
