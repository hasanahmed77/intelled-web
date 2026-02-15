import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser(redirectTo?: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const target = redirectTo
      ? `/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`
      : "/auth/sign-in";
    redirect(target);
  }

  return data.user;
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
