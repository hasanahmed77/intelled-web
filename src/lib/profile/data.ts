import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const fetchProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, primary_learning_goal")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
});
