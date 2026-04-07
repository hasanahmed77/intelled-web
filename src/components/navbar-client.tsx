"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState, useTransition } from "react";
import {
  listNotificationsAction,
  markNotificationsReadAction
} from "@/app/actions/notifications";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserNotification } from "@/lib/notifications/data";
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
const STREAK_CACHE_KEY = "intelled-navbar-streak";
const STREAK_CACHE_TTL_MS = 5 * 60 * 1000;

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

export function NavbarClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const username = userEmail.split("@")[0] ?? "";
  const initial = username.charAt(0).toUpperCase();
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  );

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const nextNotifications = await listNotificationsAction();
      setNotifications(nextNotifications);
    } catch {
      // ignore transient notification loading failures in the navbar
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString()
      }))
    );

    try {
      await markNotificationsReadAction();
    } catch {
      // ignore; next fetch will reconcile
    }
  };

  const fetchStreak = async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("worksheet_attempts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const nextStreak = calculateStreakStats(data ?? []).currentStreak;
    setCurrentStreak(nextStreak);
    window.localStorage.setItem(
      STREAK_CACHE_KEY,
      JSON.stringify({ userId, value: nextStreak, updatedAt: Date.now() })
    );
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
      if (user) {
        loadNotifications();
        const cachedRaw = window.localStorage.getItem(STREAK_CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as {
              userId?: string;
              value?: number;
              updatedAt?: number;
            };
            if (
              cached.userId === user.id &&
              typeof cached.value === "number" &&
              typeof cached.updatedAt === "number" &&
              Date.now() - cached.updatedAt < STREAK_CACHE_TTL_MS
            ) {
              setCurrentStreak(cached.value);
              return;
            }
          } catch {
            window.localStorage.removeItem(STREAK_CACHE_KEY);
          }
        }
        fetchStreak(user.id);
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
      setUserEmail(session?.user?.email ?? "");
      if (session?.user) {
        fetchStreak(session.user.id);
        loadNotifications();
      } else {
        setCurrentStreak(0);
        setNotifications([]);
        window.localStorage.removeItem(STREAK_CACHE_KEY);
      }
    });

    // Re-fetch streak after worksheet submission
    const handleStreakChanged = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          fetchStreak(data.session.user.id);
          loadNotifications();
        }
      });
    };
    window.addEventListener("streak-changed", handleStreakChanged);

    const handleWindowFocus = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          loadNotifications();
        }
      });
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("streak-changed", handleStreakChanged);
      window.removeEventListener("focus", handleWindowFocus);
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
  const adminActive = pathname === "/admin/payments" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (notificationsOpen) {
      void markNotificationsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsOpen]);

  const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    const deltaMs = Date.now() - date.getTime();
    const minutes = Math.max(Math.floor(deltaMs / 60000), 0);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

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
          {isAdmin ? (
            <Link className={desktopNavClass(adminActive)} href="/admin/payments" prefetch onClick={handleNavClick("/admin/payments")}>
              Admin
            </Link>
          ) : null}
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((current) => !current);
                      setMenuOpen(false);
                    }}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm transition hover:border-accent hover:text-accent ${
                      unreadCount > 0 ? "profile-fire-aura" : "border-zinc-600 text-zinc-300"
                    } ${
                      notificationsOpen ? "border-accent text-accent" : ""
                    }`}
                    aria-label="Open notifications"
                  >
                    <span aria-hidden="true">🔔</span>
                    {unreadCount > 0 ? (
                      <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-2 w-[22rem] rounded-2xl border border-ink-700 bg-ink-950/95 p-3 shadow-glow">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <p className="text-sm font-semibold text-zinc-100">Notifications</p>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-sm text-muted transition hover:border-accent hover:text-accent"
                          onClick={() => setNotificationsOpen(false)}
                          aria-label="Close notifications"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      {notificationsLoading ? (
                        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-sm text-muted">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 && unreadCount === 0 ? (
                        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-sm text-muted">
                          No notifications yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`rounded-xl border p-3 ${
                                notification.read_at
                                  ? "border-ink-700 bg-ink-900/55"
                                  : "border-accent/40 bg-accent/10"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-zinc-100">
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-zinc-300">
                                    {notification.body}
                                  </p>
                                </div>
                                <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
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
            {isAdmin ? (
              <Link className={mobileNavClass(adminActive)} href="/admin/payments" prefetch onClick={handleNavClick("/admin/payments", () => setMenuOpen(false))}>
                Admin
              </Link>
            ) : null}
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
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setNotificationsOpen((current) => !current);
                        }}
                        className={`relative flex h-9 w-9 items-center justify-center rounded-full border bg-ink-900/70 text-sm transition hover:border-accent hover:text-accent ${
                          unreadCount > 0 ? "profile-fire-aura" : "border-zinc-600 text-zinc-300"
                        } ${
                          notificationsOpen ? "border-accent text-accent" : ""
                        }`}
                        aria-label="Open notifications"
                      >
                        <span aria-hidden="true">🔔</span>
                        {unreadCount > 0 ? (
                          <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-black">
                            {unreadCount}
                          </span>
                        ) : null}
                      </button>
                    </div>
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
                  </>
                ) : null}
                <AuthButton isAuthed={isAuthed} />
              </div>
            )}
            {isAuthed && notificationsOpen ? (
              <div className="mt-3 rounded-2xl border border-ink-700 bg-ink-950/95 p-3 shadow-glow">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-zinc-100">Notifications</p>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-sm text-muted transition hover:border-accent hover:text-accent"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                {notificationsLoading ? (
                  <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-sm text-muted">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 && unreadCount === 0 ? (
                  <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-sm text-muted">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-xl border p-3 ${
                          notification.read_at
                            ? "border-ink-700 bg-ink-900/55"
                            : "border-accent/40 bg-accent/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-300">
                              {notification.body}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted">
                            {formatNotificationTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
