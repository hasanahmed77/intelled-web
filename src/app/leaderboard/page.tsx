import { fetchLeaderboard } from "@/lib/gamification/data";
import { LEVELS } from "@/lib/gamification/types";
import { ViewportSection } from "@/components/viewport-section";

function levelName(level: number): string {
  return LEVELS[Math.max(0, Math.min(level - 1, LEVELS.length - 1))].name;
}

const RANK_STYLE: Record<number, string> = {
  1: "text-accent font-bold",
  2: "text-zinc-300 font-semibold",
  3: "text-amber-600 font-semibold",
};

export default async function LeaderboardPage() {
  const entries = await fetchLeaderboard();

  return (
    <ViewportSection innerClassName="space-y-8 pt-6 pb-20">
      <div className="space-y-2">
        <span className="tag">Global</span>
        <h1 className="text-3xl font-semibold">Leaderboard</h1>
        <p className="text-muted">Top 10 practitioners ranked by attempts and average score.</p>
      </div>

      {entries.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          No data yet. Be the first to practice.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`card flex items-center gap-4 p-5 ${entry.rank <= 3 ? "border-ink-600" : ""}`}
            >
              {/* Rank */}
              <div className={`w-8 shrink-0 text-center text-lg ${RANK_STYLE[entry.rank] ?? "text-zinc-500"}`}>
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
              </div>

              {/* Avatar placeholder */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-900 text-sm font-semibold text-zinc-300">
                {entry.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Name + level */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{entry.display_name}</p>
                <p className="text-xs text-muted">{levelName(entry.level)}</p>
              </div>

              {/* Stats */}
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-medium">
                  {entry.attempt_count} {entry.attempt_count === 1 ? "attempt" : "attempts"}
                </p>
                <p className="text-xs text-muted">avg {entry.avg_score ?? 0}%</p>
              </div>

              {/* Streak */}
              {entry.current_streak > 0 ? (
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    🔥 {entry.current_streak}d
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        Rankings update in real-time as users practice.
      </p>
    </ViewportSection>
  );
}
