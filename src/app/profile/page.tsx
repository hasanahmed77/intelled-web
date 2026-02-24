import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fetchAttempts, fetchWorksheets } from "@/lib/worksheet/data";

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const username = (user.email ?? "user").split("@")[0];
  const [attempts, worksheets] = await Promise.all([
    fetchAttempts(user.id),
    fetchWorksheets(user.id)
  ]);
  const completedWorksheetIds = new Set(
    attempts
      .map((attempt) => attempt.worksheet_id)
      .filter((id): id is string => Boolean(id))
  );

  const average =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / attempts.length)
      : 0;

  return (
    <div className="min-h-[calc(100svh-6rem)] space-y-10 pb-16 pt-24">
      <div className="space-y-2">
        <span className="tag">Profile</span>
        <h1 className="text-3xl font-semibold">{toTitleCase(username)}</h1>
        <p className="text-muted">Track how your worksheets are improving over time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-muted">Average score</p>
          <p className="mt-3 text-3xl font-semibold">{average}%</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Worksheets generated</p>
          <p className="mt-3 text-3xl font-semibold">{worksheets.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Attempts submitted</p>
          <p className="mt-3 text-3xl font-semibold">{attempts.length}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent worksheets</h2>
          <span className="text-sm text-muted">{worksheets.length} total</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {worksheets.map((worksheet) => (
            <Link
              key={worksheet.id}
              className="card p-5 transition hover:border-accent"
              href={`/practice/${worksheet.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{toTitleCase(worksheet.title)}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      completedWorksheetIds.has(worksheet.id)
                        ? "border-green-500/40 text-green-400"
                        : "border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {completedWorksheetIds.has(worksheet.id) ? "Complete" : "Incomplete"}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">
                    {worksheet.difficulty}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{worksheet.topic}</p>
              <p className="mt-4 text-xs text-muted">
                Created {new Date(worksheet.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {worksheets.length === 0 ? (
            <div className="card p-6 text-sm text-muted">
              No worksheets yet. Generate your first worksheet from Practice.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
