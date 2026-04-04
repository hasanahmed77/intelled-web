import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().has(email.trim().toLowerCase());
}

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

export async function requireAdminUser(redirectTo = "/") {
  const user = await requireUser(redirectTo);

  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  return user;
}
