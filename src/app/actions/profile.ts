"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export async function loadMoreWorksheetsAction(offset: number): Promise<
  Array<{ id: string; title: string; difficulty: string; created_at: string }>
> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("worksheets")
    .select("id, title, difficulty, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  return (data ?? []).map((w) => ({
    id: w.id as string,
    title: w.title as string,
    difficulty: w.difficulty as string,
    created_at: w.created_at as string,
  }));
}
