import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const fetchProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, primary_learning_goal, current_streak, longest_streak, last_activity_date, total_xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
});

export const fetchUserLearningStats = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_learning_stats")
    .select("attempt_count, avg_score, best_score, last_attempt_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
});
