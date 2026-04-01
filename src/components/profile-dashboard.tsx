"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedName } from "@/components/animated-name";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { ProfileSidebar } from "@/components/profile-sidebar";
import type { ProfileTab } from "@/components/profile-sidebar";
import { loadMoreWorksheetsAction } from "@/app/actions/profile";

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-800 pb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {meta && <span className="text-sm text-muted">{meta}</span>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

const CIRCLE_R = 40;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R; // ≈ 251.3

function CircleProgress({
  pct,
  label,
  sublabel,
  color = "accent",
}: {
  pct: number;
  label: string;
  sublabel?: string;
  color?: "accent" | "green";
}) {
  const offset = CIRCLE_C * (1 - Math.min(pct, 100) / 100);
  const stroke = color === "green" ? "#4ade80" : "rgb(var(--color-accent, 255 214 10))";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle
            cx="48" cy="48" r={CIRCLE_R}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="text-ink-800"
          />
          <circle
            cx="48" cy="48" r={CIRCLE_R}
            fill="none"
            stroke={stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCLE_C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-muted">{sublabel}</p>}
      </div>
    </div>
  );
}

export type BadgeItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type WorksheetItem = {
  id: string;
  title: string;
  difficulty: string;
  created_at: string;
  done: boolean;
};

function ProblemSetsTab({
  initialWorksheets,
  totalWorksheets,
  worksheetLimit,
  completedIds,
}: {
  initialWorksheets: WorksheetItem[];
  totalWorksheets: number;
  worksheetLimit: number | null;
  completedIds: Set<string>;
}) {
  const [worksheets, setWorksheets] = useState(initialWorksheets);
  const [isPending, startTransition] = useTransition();

  // Effective ceiling: plan limit (if set) capped by what actually exists in DB
  const effectiveMax =
    worksheetLimit !== null ? Math.min(worksheetLimit, totalWorksheets) : totalWorksheets;
  const hasMore = worksheets.length < effectiveMax;

  const loadMore = () => {
    startTransition(async () => {
      const next = await loadMoreWorksheetsAction(worksheets.length);
      const capped = worksheetLimit !== null
        ? next.slice(0, effectiveMax - worksheets.length)
        : next;
      setWorksheets((prev) => [
        ...prev,
        ...capped.map((w) => ({ ...w, done: completedIds.has(w.id) })),
      ]);
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeading title="Problem Sets" />
      {worksheets.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No problem sets yet. Generate your first one from{" "}
          <Link href="/practice" className="text-accent underline underline-offset-4">
            Practice
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {worksheets.map((ws) => (
              <Link
                key={ws.id}
                className="card group p-5 transition hover:border-accent"
                href={`/practice/${ws.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug transition group-hover:text-accent">
                    {toTitleCase(ws.title)}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      ws.done
                        ? "border-green-500/40 text-green-400"
                        : "border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {ws.done ? "Complete" : "Incomplete"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span className="uppercase tracking-widest">{ws.difficulty}</span>
                  <span>{new Date(ws.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={isPending}
                className="button"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading…
                  </span>
                ) : (
                  `Load more (${effectiveMax - worksheets.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type ProfileDashboardProps = {
  initialTab: string;
  displayName: string;
  goalText: string;
  // Overview
  average: number;
  worksheetCount: number;
  attemptCount: number;
  currentStreak: number;
  longestStreak: number;
  // Progress
  totalXp: number;
  levelNumber: number;
  levelName: string;
  nextLevelName: string | null;
  xpIntoLevel: number;
  xpNeededForNext: number | null;
  progressPct: number;
  weeklyChallenge: { title: string; description: string; goal: number };
  challengeDone: number;
  challengeCompleted: boolean;
  challengePct: number;
  // Badges
  earnedBadges: BadgeItem[];
  lockedBadges: BadgeItem[];
  // Problem sets
  worksheets: WorksheetItem[];
  totalWorksheets: number;
  worksheetLimit: number | null;
  completedWorksheetIds: string[];
  // Subscription
  planId: string;
  planStatus: string;
  periodEnd: string | null;
  autoRenew: boolean;
  currentUsed: number;
  currentLimit: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAction: () => Promise<void>;
};

export function ProfileDashboard(props: ProfileDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>(
    (props.initialTab as ProfileTab) ?? "overview"
  );

  const switchTab = useCallback(
    (next: ProfileTab) => {
      setTab(next);
      router.replace(`/profile?tab=${next}`, { scroll: false });
    },
    [router]
  );

  // ── Tab content ──────────────────────────────────────────────

  let content: React.ReactNode;

  if (tab === "overview") {
    const streak = props.currentStreak;
    const longest = props.longestStreak;
    content = (
      <div className="space-y-6">
        <SectionHeading title="Overview" />
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted">Stats</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Average score" value={`${props.average}%`} />
            <StatCard label="Problem sets generated" value={props.worksheetCount} />
            <StatCard label="Attempts submitted" value={props.attemptCount} />
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted">Streaks</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <p className="text-sm text-muted">Current streak</p>
              <p className="mt-3 text-3xl font-semibold">
                {streak}
                <span className="ml-2 text-base font-normal text-muted">
                  {streak === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">
                {streak === 0
                  ? "Submit an attempt today to start your streak."
                  : "Keep practicing daily to maintain it."}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-muted">Longest streak</p>
              <p className="mt-3 text-3xl font-semibold">
                {longest}
                <span className="ml-2 text-base font-normal text-muted">
                  {longest === 1 ? "day" : "days"}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">Your personal best.</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (tab === "progress") {
    content = (
      <div className="space-y-6">
        <SectionHeading title="Progress" />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Level card */}
          <div className="card flex flex-col items-center gap-4 p-6">
            <p className="self-start text-xs uppercase tracking-widest text-muted">Level</p>
            <CircleProgress
              pct={props.progressPct}
              label={props.levelName}
              sublabel={`Level ${props.levelNumber} of 9`}
              color="accent"
            />
            <div className="w-full space-y-1 border-t border-ink-800 pt-4 text-center">
              <p className="text-sm font-semibold">{props.totalXp.toLocaleString()} XP</p>
              {props.nextLevelName ? (
                <p className="text-xs text-muted">
                  {props.xpIntoLevel} / {props.xpNeededForNext} XP to {props.nextLevelName}
                </p>
              ) : (
                <p className="text-xs text-muted">Max level reached</p>
              )}
            </div>
            <p className="text-center text-xs text-muted">
              +10 XP per attempt, up to +10 bonus from score.
            </p>
          </div>

          {/* Weekly challenge card */}
          <div className="card flex flex-col items-center gap-4 p-6">
            <div className="flex w-full items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted">Weekly Challenge</p>
              {props.challengeCompleted ? (
                <span className="rounded-full border border-green-500/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-green-400">
                  Done
                </span>
              ) : (
                <span className="rounded-full border border-ink-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-500">
                  Active
                </span>
              )}
            </div>
            <CircleProgress
              pct={props.challengePct}
              label={props.weeklyChallenge.title}
              sublabel={`${props.challengeDone} / ${props.weeklyChallenge.goal}`}
              color={props.challengeCompleted ? "green" : "accent"}
            />
            <div className="w-full border-t border-ink-800 pt-4">
              <p className="text-center text-xs text-muted">{props.weeklyChallenge.description}</p>
            </div>
            <p className="text-center text-xs text-muted">
              Resets every Monday. Earn the Weekly Warrior badge on completion.
            </p>
          </div>
        </div>
      </div>
    );
  } else if (tab === "badges") {
    content = (
      <div className="space-y-6">
        <SectionHeading
          title="Badges"
          meta={`${props.earnedBadges.length} / ${props.earnedBadges.length + props.lockedBadges.length} earned`}
        />
        {props.earnedBadges.length > 0 && (
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">Earned</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {props.earnedBadges.map((badge) => (
                <div key={badge.id} className="card flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                    {badge.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {props.lockedBadges.length > 0 && (
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">Locked</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {props.lockedBadges.map((badge) => (
                <div key={badge.id} className="card flex items-center gap-4 p-4 opacity-40 grayscale">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-2xl">
                    {badge.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {props.earnedBadges.length === 0 && (
          <div className="card p-8 text-center text-sm text-muted">
            No badges yet. Submit a problem set to earn your first one.
          </div>
        )}
      </div>
    );
  } else if (tab === "sets") {
    const completedSet = new Set(props.completedWorksheetIds);
    content = (
      <ProblemSetsTab
        initialWorksheets={props.worksheets}
        totalWorksheets={props.totalWorksheets}
        worksheetLimit={props.worksheetLimit}
        completedIds={completedSet}
      />
    );
  } else {
    content = (
      <div className="space-y-6">
        <SectionHeading title="Subscription" />
        <div className="card space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Current plan</p>
              <p className="mt-1 text-2xl font-semibold uppercase">{props.planId}</p>
            </div>
            <span className="rounded-full border border-ink-700 px-3 py-1 text-xs uppercase tracking-widest text-zinc-300">
              {props.planStatus.toUpperCase()}
            </span>
          </div>
          <div className="grid gap-6 border-t border-ink-800 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Period ends</p>
              <p className="mt-2 text-base font-medium">
                {props.periodEnd ? new Date(props.periodEnd).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Auto renew</p>
              <p className="mt-2 text-base font-medium">{props.autoRenew ? "Enabled" : "Disabled"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">
                {props.planId === "free" ? "Free lifetime used" : "Sets used this period"}
              </p>
              <p className="mt-2 text-base font-medium">
                {props.currentUsed}
                {props.currentLimit !== null ? ` / ${props.currentLimit}` : ""}
              </p>
            </div>
          </div>
          {props.planId !== "free" && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-800 pt-5">
              <p className="text-sm text-muted">
                Cancellation takes effect at the end of the current billing period.
              </p>
              {props.cancelAtPeriodEnd ? (
                <span className="rounded-full border border-amber-500/40 px-3 py-1 text-xs uppercase tracking-widest text-amber-300">
                  Cancel scheduled
                </span>
              ) : (
                <ConfirmActionForm
                  action={props.cancelAction}
                  title="Cancel subscription?"
                  message="Your subscription will stay active until the current billing period ends, and auto-renew will be turned off."
                  buttonLabel="Cancel subscription"
                  className="button border-red-500/50 text-red-300 hover:border-red-400 hover:text-red-200"
                />
              )}
            </div>
          )}
        </div>
        {props.planId === "free" && (
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="font-semibold">Upgrade your plan</p>
              <p className="mt-1 text-sm text-muted">
                Unlock unlimited problem sets and priority access.
              </p>
            </div>
            <Link href="/pricing" className="button button-primary">
              View plans
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-[calc(var(--navbar-h)+1.5rem)] pb-20">
      {/* Page header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold">
          <AnimatedName name={props.displayName} />
        </h1>
        {props.earnedBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {props.earnedBadges.map((badge) => (
              <span
                key={badge.id}
                title={`${badge.name} — ${badge.description}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-sm leading-none border border-ink-700/60 hover:border-accent/50 transition cursor-default"
              >
                {badge.icon}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-muted">{props.goalText}</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        <ProfileSidebar
          activeTab={tab}
          onTabChange={switchTab}
          badgeCount={props.earnedBadges.length}
        />
        <div className="min-w-0 flex-1">{content}</div>
      </div>
    </div>
  );
}
