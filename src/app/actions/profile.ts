"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export async function fetchWorksheetPageAction(offset: number, remaining: number): Promise<
  Array<{ id: string; title: string; difficulty: string; source: "ai" | "static"; created_at: string; done: boolean }>
> {
  if (remaining <= 0) {
    return [];
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("worksheets")
    .select("id, title, difficulty, source, created_at, worksheet_attempts(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + Math.min(PAGE_SIZE, remaining) - 1);

  return (data ?? []).map((w) => ({
    id: w.id as string,
    title: w.title as string,
    difficulty: w.difficulty as string,
    source: ((w.source as string | null) ?? "ai") as "ai" | "static",
    created_at: w.created_at as string,
    done: Array.isArray(w.worksheet_attempts) && w.worksheet_attempts.length > 0
  }));
}
