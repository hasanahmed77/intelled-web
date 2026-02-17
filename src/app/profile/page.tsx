import { requireUser } from "@/lib/auth";
import { fetchAttempts, fetchWorksheets } from "@/lib/worksheet/data";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [attempts, worksheets] = await Promise.all([
    fetchAttempts(user.id),
    fetchWorksheets(user.id)
  ]);

  const average =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / attempts.length)
      : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="tag">Profile</span>
        <h1 className="text-3xl font-semibold">Your progress</h1>
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
        <h2 className="text-xl font-semibold">Recent attempts</h2>
        <div className="grid gap-4">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="card flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted">
                  {attempt.worksheets?.[0]?.topic ?? ""}
                </p>
                <p className="text-lg font-semibold">
                  {attempt.worksheets?.[0]?.title ?? "Worksheet"}
                </p>
              </div>
              <div className="text-sm text-muted">
                <p>Score: {attempt.score}%</p>
                <p>Difficulty: {attempt.difficulty_used}</p>
              </div>
            </div>
          ))}
          {attempts.length === 0 ? (
            <div className="card p-6 text-sm text-muted">No attempts yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
