"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthButton } from "@/components/auth-button";

function desktopNavClass(active: boolean) {
  return `transition hover:text-accent ${
    active ? "text-accent underline decoration-accent/80 underline-offset-8" : "text-zinc-300"
  }`;
}

function mobileNavClass(active: boolean) {
  return `rounded-lg px-3 py-2 transition ${
    active ? "bg-ink-900 text-accent" : "text-zinc-200 hover:bg-ink-900/70"
  }`;
}

export function NavbarClient() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const pricingActive = pathname === "/pricing";
  const practiceActive = pathname.startsWith("/practice");
  const profileActive = pathname === "/profile";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      />
      <div className="relative mx-auto flex h-[var(--navbar-h)] w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo.svg"
            alt="intellED logo"
            width={164}
            height={44}
            priority
            className="h-8 w-auto object-contain md:h-10"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700 bg-ink-900/70 text-zinc-200 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="text-xl leading-none">{menuOpen ? "×" : "☰"}</span>
        </button>
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <Link className={desktopNavClass(pricingActive)} href="/pricing">
            Pricing
          </Link>
          {loading ? (
            <span className="cursor-not-allowed text-zinc-500 line-through decoration-zinc-500/80">
              Practice
            </span>
          ) : isAuthed ? (
            <Link className={desktopNavClass(practiceActive)} href="/practice">
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
                    profileActive
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
      {menuOpen ? (
        <div className="relative mx-4 mt-2 rounded-2xl border border-ink-700 bg-ink-950/95 p-4 shadow-glow lg:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            <Link className={mobileNavClass(pricingActive)} href="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </Link>
            {loading ? (
              <span className="rounded-lg px-3 py-2 text-zinc-500 line-through decoration-zinc-500/80">
                Practice
              </span>
            ) : isAuthed ? (
              <Link className={mobileNavClass(practiceActive)} href="/practice" onClick={() => setMenuOpen(false)}>
                Practice
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="rounded-lg px-3 py-2 text-zinc-500 line-through decoration-zinc-500/80"
                title="Sign in to access Practice"
              >
                Practice
              </span>
            )}

            {loading ? (
              <span className="h-10 w-full animate-pulse rounded-full border border-ink-700 bg-ink-900/70" />
            ) : (
              <div className="mt-2 flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                {isAuthed ? (
                  <Link
                    href="/profile"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm font-semibold transition hover:border-accent hover:text-accent ${
                      profileActive ? "border-accent text-accent" : "border-ink-700 text-white"
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
      ) : null}
    </header>
  );
}
