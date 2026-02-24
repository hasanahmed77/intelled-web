"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthButton } from "@/components/auth-button";

export function NavbarClient() {
  const pathname = usePathname();
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
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo.svg"
            alt="intellED logo"
            width={164}
            height={44}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            className={`transition hover:text-accent ${
              pathname === "/pricing"
                ? "text-accent underline decoration-accent/80 underline-offset-8"
                : "text-zinc-300"
            }`}
            href="/pricing"
          >
            Pricing
          </Link>
          {loading ? (
            <span className="cursor-not-allowed text-zinc-500 line-through decoration-zinc-500/80">
              Practice
            </span>
          ) : isAuthed ? (
            <Link
              className={`transition hover:text-accent ${
                pathname.startsWith("/practice")
                  ? "text-accent underline decoration-accent/80 underline-offset-8"
                  : "text-zinc-300"
              }`}
              href="/practice"
            >
              Practice
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="cursor-not-allowed text-zinc-500 line-through decoration-zinc-500/80"
              title="Sign in to access Practice"
            >
              Practice
            </span>
          )}
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full border border-ink-700 bg-ink-900/70" />
          ) : (
            <div className="flex items-center gap-3">
              {isAuthed ? (
                <Link
                  href="/profile"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm font-semibold transition hover:border-accent hover:text-accent ${
                    pathname === "/profile"
                      ? "border-accent text-accent"
                      : "border-ink-700 text-white"
                  }`}
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
