"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthButton({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();

  if (!isAuthed) {
    return (
      <Link className="button" href="/auth/sign-in">
        Sign in
      </Link>
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
