import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  attempt_count: number;
  avg_score: number;
  current_streak: number;
  level: number;
}

export const fetchLeaderboard = cache(async (): Promise<LeaderboardEntry[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardEntry[];
});

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
