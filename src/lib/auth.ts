import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser(redirectTo?: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    const target = redirectTo
      ? `/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`
      : "/auth/sign-in";
    redirect(target);
  }

  return user;
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
