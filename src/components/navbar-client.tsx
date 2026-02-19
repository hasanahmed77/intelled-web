"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthButton } from "@/components/auth-button";

export function NavbarClient() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const username = userEmail.split("@")[0] ?? "";
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(Boolean(data.user));
      setUserEmail(data.user?.email ?? "");
      setLoading(false);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
      setUserEmail(session?.user?.email ?? "");
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
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full border border-ink-700 bg-ink-900" />
          ) : (
            <div className="flex items-center gap-3">
              {isAuthed ? (
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-sm font-semibold text-white transition hover:border-accent hover:text-accent"
                  aria-label="Open profile"
                >
                  {initial || "U"}
                </Link>
              ) : null}
              <AuthButton isAuthed={isAuthed} />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
