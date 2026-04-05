import { requireUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import { fetchProfile, fetchUserLearningStats } from "@/lib/profile/data";
import { fetchWorksheets } from "@/lib/worksheet/data";
import { fetchUserBadges, fetchCurrentChallengeProgress } from "@/lib/gamification/data";
import { getLevelInfo, getCurrentWeekChallenge, BADGE_DEFINITIONS } from "@/lib/gamification/types";
import { ProfileDashboard } from "@/components/profile-dashboard";
import type { BadgeItem, WorksheetItem } from "@/components/profile-dashboard";
import type { BillingPlanId } from "@/lib/billing/types";

const VALID_TABS = ["overview", "progress", "badges", "sets", "subscription"] as const;
const PAGE_SIZE = 10;
const PLAN_DISPLAY_NAME: Record<BillingPlanId, string> = {
  free: "FREE",
  static_monthly: "ESSENTIAL",
  hybrid_monthly: "PLUS",
  hybrid_yearly: "PRO"
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawTab = typeof params.tab === "string" ? params.tab : "overview";
  const initialTab = VALID_TABS.includes(rawTab as (typeof VALID_TABS)[number])
    ? rawTab
    : "overview";

  const user = await requireUser("/profile");
  const fallbackName = (user.email ?? "user").split("@")[0];

  const [{ data: worksheetData, total: totalWorksheets }, billing, plans, profile, learningStats, userBadges, challengeProgress] =
    await Promise.all([
      fetchWorksheets(user.id, PAGE_SIZE, 0),
      getCurrentSubscription(user.id),
      listActivePlans(),
      fetchProfile(user.id),
      fetchUserLearningStats(user.id),
      fetchUserBadges(user.id),
      fetchCurrentChallengeProgress(user.id),
    ]);

  const displayName = profile?.full_name?.trim() || fallbackName;
  const goalText = profile?.primary_learning_goal?.trim()
    ? `Focused on ${profile.primary_learning_goal}.`
    : "Track your learning progress and achievements.";

  const average = Math.round(Number(learningStats?.avg_score ?? 0));
  const attemptCount = learningStats?.attempt_count ?? 0;

  // Billing
  const currentPlanId = (billing.subscription?.plan_id ?? "free") as BillingPlanId;
  const currentPlan =
    plans.find((p) => p.id === currentPlanId) ?? plans.find((p) => p.id === "free") ?? null;
  const worksheetLimit: number | null =
    currentPlanId === "free"
      ? ((currentPlan?.free_static_problem_sets_lifetime_limit ?? 5) +
          (currentPlan?.free_ai_problem_sets_lifetime_limit ?? 2))
      : ((currentPlan?.static_problem_sets_per_period ?? 0) +
          (currentPlan?.ai_problem_sets_per_period ?? 0));
  const freeUsed = billing.usage?.free_static_problem_sets_used_lifetime ?? 0;
  const freeAiUsed = billing.usage?.free_ai_problem_sets_used_lifetime ?? 0;
  const staticUsed = billing.usage?.period_static_problem_sets_used ?? 0;
  const aiUsed = billing.usage?.period_ai_problem_sets_used ?? 0;
  const staticLimit =
    currentPlanId === "free" ? null : (currentPlan?.static_problem_sets_per_period ?? null);
  const aiLimit =
    currentPlanId === "free" ? null : (currentPlan?.ai_problem_sets_per_period ?? null);

  // XP / Level
  const totalXp = profile?.total_xp ?? 0;
  const { current: lvl, next: nextLvl, progressPct } = getLevelInfo(totalXp);

  // Weekly challenge
  const weeklyChallenge = getCurrentWeekChallenge();
  const challengeDone = challengeProgress?.progress ?? 0;
  const challengeCompleted = challengeProgress?.completed ?? false;
  const challengePct = Math.min(Math.round((challengeDone / weeklyChallenge.goal) * 100), 100);

  // Badges
  const earnedIds = new Set(userBadges.map((b) => b.badge_id));
  const earnedBadges: BadgeItem[] = BADGE_DEFINITIONS.filter((b) => earnedIds.has(b.id));
  const lockedBadges: BadgeItem[] = BADGE_DEFINITIONS.filter((b) => !earnedIds.has(b.id));

  // Worksheets — cap initial batch to plan limit
  const cappedData = worksheetLimit !== null
    ? worksheetData.slice(0, worksheetLimit)
    : worksheetData;
  const visibleWorksheetCount =
    worksheetLimit !== null ? Math.min(totalWorksheets, worksheetLimit) : totalWorksheets;

  const worksheetItems: WorksheetItem[] = cappedData.map((w) => ({
    id: w.id,
    title: w.title,
    difficulty: w.difficulty,
    source: ((w.source as string | null) ?? "ai") as "ai" | "static",
    created_at: w.created_at,
    done: w.done ?? false,
  }));

  return (
    <ProfileDashboard
      initialTab={initialTab}
      displayName={displayName}
      goalText={goalText}
      average={average}
      worksheetCount={visibleWorksheetCount}
      attemptCount={attemptCount}
      currentStreak={profile?.current_streak ?? 0}
      longestStreak={profile?.longest_streak ?? 0}
      totalXp={totalXp}
      levelNumber={lvl.level}
      levelName={lvl.name}
      nextLevelName={nextLvl?.name ?? null}
      xpIntoLevel={totalXp - lvl.minXp}
      xpNeededForNext={nextLvl ? nextLvl.minXp - lvl.minXp : null}
      progressPct={progressPct}
      weeklyChallenge={weeklyChallenge}
      challengeDone={challengeDone}
      challengeCompleted={challengeCompleted}
      challengePct={challengePct}
      earnedBadges={earnedBadges}
      lockedBadges={lockedBadges}
      worksheets={worksheetItems}
      totalWorksheets={totalWorksheets}
      worksheetLimit={worksheetLimit}
      planId={currentPlanId}
      planName={PLAN_DISPLAY_NAME[currentPlanId]}
      planStatus={billing.subscription?.status ?? "active"}
      periodEnd={billing.subscription?.period_end ?? null}
      freeUsed={freeUsed}
      freeLimit={currentPlan?.free_static_problem_sets_lifetime_limit ?? 5}
      staticUsed={staticUsed}
      staticLimit={staticLimit}
      aiUsed={currentPlanId === "free" ? freeAiUsed : aiUsed}
      aiLimit={currentPlanId === "free"
        ? (currentPlan?.free_ai_problem_sets_lifetime_limit ?? 2)
        : aiLimit}
    />
  );
}
