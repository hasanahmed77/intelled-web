"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthButton } from "@/components/auth-button";

export function NavbarClient() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(Boolean(data.user));
      setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b border-ink-800/80 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-accent shadow-glow" />
          <span className="text-sm uppercase tracking-[0.3em] text-muted">intellED</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link className="hover:text-accent" href="/pricing">
            Pricing
          </Link>
          <Link className="hover:text-accent" href="/practice">
            Practice
          </Link>
          <Link className="hover:text-accent" href="/profile">
            Profile
          </Link>
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full border border-ink-700 bg-ink-900" />
          ) : (
            <AuthButton isAuthed={isAuthed} />
          )}
        </nav>
      </div>
    </header>
  );
}
