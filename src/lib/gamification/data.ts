import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateStreakStats } from "@/lib/streaks";

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  attempt_count: number;
  avg_score: number;
  current_streak: number;
  level: number;
}

const getCachedLeaderboard = unstable_cache(async (): Promise<LeaderboardEntry[]> => {
  const supabase = createSupabaseAdminClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, level");
  if (profileError) throw new Error(profileError.message);

  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw new Error(userError.message);

  const { data: attempts, error: attemptError } = await supabase
    .from("worksheet_attempts")
    .select("user_id, score, created_at");
  if (attemptError) throw new Error(attemptError.message);

  const emailByUserId = new Map(users.users.map((user) => [user.id, user.email ?? "user"]));
  const attemptsByUserId = new Map<string, Array<{ score: number; created_at: string | null }>>();

  for (const attempt of attempts ?? []) {
    const existing = attemptsByUserId.get(attempt.user_id) ?? [];
    existing.push({ score: attempt.score, created_at: attempt.created_at });
    attemptsByUserId.set(attempt.user_id, existing);
  }

  return (profiles ?? [])
    .map((profile) => {
      const userAttempts = attemptsByUserId.get(profile.id) ?? [];
      const avgScore =
        userAttempts.length > 0
          ? Number(
              (userAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / userAttempts.length)
                .toFixed(1)
            )
          : 0;
      const streakStats = calculateStreakStats(userAttempts);
      const fallbackName = emailByUserId.get(profile.id)?.split("@")[0] ?? "user";

      return {
        display_name: profile.full_name?.trim() || fallbackName,
        attempt_count: userAttempts.length,
        avg_score: avgScore,
        current_streak: streakStats.currentStreak,
        level: profile.level ?? 1,
      };
    })
    .sort((a, b) => {
      if (b.attempt_count !== a.attempt_count) return b.attempt_count - a.attempt_count;
      return b.avg_score - a.avg_score;
    })
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
}, ["leaderboard"], { revalidate: 300, tags: ["leaderboard"] });

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return getCachedLeaderboard();
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export const fetchUserBadges = cache(async (userId: string): Promise<UserBadge[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export interface ChallengeProgress {
  challenge_index: number;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  week_start: string;
}

export const fetchCurrentChallengeProgress = cache(
  async (userId: string): Promise<ChallengeProgress | null> => {
    const supabase = await createSupabaseServerClient();

    const today = new Date();
    const dow = today.getUTCDay();
    const monday = new Date(today);
    monday.setUTCHours(0, 0, 0, 0);
    monday.setUTCDate(monday.getUTCDate() - ((dow + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_challenge_progress")
      .select("challenge_index, progress, completed, completed_at, week_start")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ?? null;
  }
);
