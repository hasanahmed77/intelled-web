"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { calculateStreakStats } from "@/lib/streaks";
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

const practiceTooltip = "Sign in to practice, legend.";
const aiPracticeTooltip = "Sign in to use AI Practice, legend.";

function CrackOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path d="M17 1 L19 9 L23 7 L20 17 L29 13 L25 23 L35 22" stroke="white" strokeWidth="0.6" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 23 L28 30 L32 33" stroke="white" strokeWidth="0.5" strokeOpacity="0.25" strokeLinecap="round" />
      <path d="M20 17 L13 22 L7 35" stroke="white" strokeWidth="0.5" strokeOpacity="0.28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 9 L11 5 L5 9" stroke="white" strokeWidth="0.4" strokeOpacity="0.2" strokeLinecap="round" />
    </svg>
  );
}

export function NavbarClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const username = userEmail.split("@")[0] ?? "";
  const initial = username.charAt(0).toUpperCase();

  const fetchStreak = async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("worksheet_attempts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setCurrentStreak(calculateStreakStats(data ?? []).currentStreak);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const load = async () => {
      // getSession reads from localStorage — no network call, near-instant
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      setIsAuthed(Boolean(user));
      setUserEmail(user?.email ?? "");
      setLoading(false);
      // Fetch streak in the background after unblocking the UI
      if (user) fetchStreak(user.id);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
      setUserEmail(session?.user?.email ?? "");
      if (session?.user) {
        fetchStreak(session.user.id);
      } else {
        setCurrentStreak(0);
      }
    });

    // Re-fetch streak after worksheet submission
    const handleStreakChanged = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) fetchStreak(data.session.user.id);
      });
    };
    window.addEventListener("streak-changed", handleStreakChanged);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("streak-changed", handleStreakChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavClick =
    (href: string, afterNavigate?: () => void) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (pathname === href) {
        afterNavigate?.();
        return;
      }

      event.preventDefault();
      afterNavigate?.();
      startTransition(() => {
        router.push(href);
      });
    };

  const pricingActive = pathname === "/pricing";
  const practiceActive = pathname === "/practice" || pathname.startsWith("/practice/");
  const aiPracticeActive = pathname === "/ai-practice" || pathname.startsWith("/ai-practice/");
  const profileActive = pathname === "/profile";
  const leaderboardActive = pathname === "/leaderboard";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      />
      <div className="relative mx-auto flex h-[var(--navbar-h)] w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center" onClick={handleNavClick("/")}>
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
          <Link className={desktopNavClass(leaderboardActive)} href="/leaderboard" prefetch onClick={handleNavClick("/leaderboard")}>
            Leaderboard
          </Link>
          <Link className={desktopNavClass(pricingActive)} href="/pricing" prefetch onClick={handleNavClick("/pricing")}>
            Pricing
          </Link>
          {loading ? (
            <span className="cursor-not-allowed text-zinc-500 line-through decoration-zinc-500/80">
              Practice
            </span>
          ) : isAuthed ? (
            <Link className={desktopNavClass(practiceActive)} href="/practice" prefetch onClick={handleNavClick("/practice")}>
              Practice
            </Link>
          ) : (
            <div className="group relative">
              <Link
                className="text-zinc-300 transition hover:text-accent"
                href="/auth/sign-in?redirect=%2Fpractice"
                prefetch
                title={practiceTooltip}
                onClick={handleNavClick("/auth/sign-in?redirect=%2Fpractice")}
              >
                Practice
              </Link>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-ink-700 bg-ink-950/95 px-3 py-2 text-center text-xs text-zinc-300 opacity-0 shadow-glow transition duration-200 group-hover:opacity-100">
                {practiceTooltip}
              </div>
            </div>
          )}
          {loading ? (
            <span className="cursor-not-allowed text-zinc-500 line-through decoration-zinc-500/80">
              AI Practice
            </span>
          ) : isAuthed ? (
            <Link className={desktopNavClass(aiPracticeActive)} href="/ai-practice" prefetch onClick={handleNavClick("/ai-practice")}>
              AI Practice
            </Link>
          ) : (
            <div className="group relative">
              <Link
                className="text-zinc-300 transition hover:text-accent"
                href="/auth/sign-in?redirect=%2Fai-practice"
                prefetch
                title={aiPracticeTooltip}
                onClick={handleNavClick("/auth/sign-in?redirect=%2Fai-practice")}
              >
                AI Practice
              </Link>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-ink-700 bg-ink-950/95 px-3 py-2 text-center text-xs text-zinc-300 opacity-0 shadow-glow transition duration-200 group-hover:opacity-100">
                {aiPracticeTooltip}
              </div>
            </div>
          )}
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full border border-ink-700 bg-ink-900/70" />
          ) : (
            <div className="flex items-center gap-3">
              {isAuthed ? (
                <div className="group relative">
                  <Link
                    href="/profile"
                    prefetch
                    onClick={handleNavClick("/profile")}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm font-semibold transition hover:border-accent hover:text-accent ${
                      currentStreak > 0 ? "profile-fire-aura" : "border-zinc-600 text-zinc-400"
                    } ${profileActive ? "border-accent text-accent" : ""}`}
                    aria-label="Open profile"
                  >
                    {initial || "U"}
                    {currentStreak === 0 ? <CrackOverlay /> : null}
                  </Link>
                  <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                    {currentStreak}
                  </span>
                  <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-ink-700 bg-ink-950/95 px-3 py-2 text-center text-xs text-zinc-300 opacity-0 shadow-glow transition duration-200 group-hover:opacity-100">
                    {currentStreak > 0
                      ? `${currentStreak} day streak — you're on fire. Don't break the chain.`
                      : "Practice daily to unlock your Super Saiyan form."}
                  </div>
                </div>
              ) : null}
              <AuthButton isAuthed={isAuthed} />
            </div>
          )}
        </nav>
      </div>
      {menuOpen ? (
        <div className="relative mx-4 mt-2 rounded-2xl border border-ink-700 bg-ink-950/95 p-4 shadow-glow lg:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            <Link className={mobileNavClass(leaderboardActive)} href="/leaderboard" prefetch onClick={handleNavClick("/leaderboard", () => setMenuOpen(false))}>
              Leaderboard
            </Link>
            <Link className={mobileNavClass(pricingActive)} href="/pricing" prefetch onClick={handleNavClick("/pricing", () => setMenuOpen(false))}>
              Pricing
            </Link>
            {loading ? (
              <span className="rounded-lg px-3 py-2 text-zinc-500 line-through decoration-zinc-500/80">
                Practice
              </span>
            ) : isAuthed ? (
              <Link className={mobileNavClass(practiceActive)} href="/practice" prefetch onClick={handleNavClick("/practice", () => setMenuOpen(false))}>
                Practice
              </Link>
            ) : (
              <Link
                className="rounded-lg px-3 py-2 text-zinc-200 transition hover:bg-ink-900/70"
                href="/auth/sign-in?redirect=%2Fpractice"
                prefetch
                onClick={handleNavClick("/auth/sign-in?redirect=%2Fpractice", () => setMenuOpen(false))}
                title={practiceTooltip}
              >
                Practice
              </Link>
            )}
            {loading ? (
              <span className="rounded-lg px-3 py-2 text-zinc-500 line-through decoration-zinc-500/80">
                AI Practice
              </span>
            ) : isAuthed ? (
              <Link className={mobileNavClass(aiPracticeActive)} href="/ai-practice" prefetch onClick={handleNavClick("/ai-practice", () => setMenuOpen(false))}>
                AI Practice
              </Link>
            ) : (
              <Link
                className="rounded-lg px-3 py-2 text-zinc-200 transition hover:bg-ink-900/70"
                href="/auth/sign-in?redirect=%2Fai-practice"
                prefetch
                onClick={handleNavClick("/auth/sign-in?redirect=%2Fai-practice", () => setMenuOpen(false))}
                title={aiPracticeTooltip}
              >
                AI Practice
              </Link>
            )}
            {loading ? (
              <span className="h-10 w-full animate-pulse rounded-full border border-ink-700 bg-ink-900/70" />
            ) : (
              <div className="mt-2 flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                {isAuthed ? (
                  <div className="relative">
                    <Link
                      href="/profile"
                      prefetch
                      onClick={handleNavClick("/profile", () => setMenuOpen(false))}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm font-semibold transition hover:border-accent hover:text-accent ${
                        currentStreak > 0 ? "profile-fire-aura" : "border-zinc-600 text-zinc-400"
                      } ${profileActive ? "border-accent text-accent" : ""}`}
                      aria-label="Open profile"
                    >
                      {initial || "U"}
                      {currentStreak === 0 ? <CrackOverlay /> : null}
                    </Link>
                    <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                      {currentStreak}
                    </span>
                  </div>
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
