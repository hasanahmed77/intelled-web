"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthButton({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();

  if (!isAuthed) {
    return (
      <a className="button" href="/auth/sign-in">
        Sign in
      </a>
    );
  }

  return (
    <button
      className="button"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.refresh();
      }}
      type="button"
    >
      Sign out
    </button>
  );
}
