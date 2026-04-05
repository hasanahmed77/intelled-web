import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BADGE_DEFINITIONS, LEVELS } from "@/lib/gamification/types";
import { calculateStreakStats } from "@/lib/streaks";

export type UserNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

const MAX_NOTIFICATIONS = 5;

function getLevelName(level: number) {
  return LEVELS.find((item) => item.level === level)?.name ?? `Level ${level}`;
}

function getBadgeName(badgeId: string) {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId)?.name ?? "New badge";
}

function getBadgeDescription(badgeId: string) {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId)?.description ?? "";
}

async function trimUserNotifications(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const staleIds = (data ?? []).slice(MAX_NOTIFICATIONS).map((row) => row.id);
  if (staleIds.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("user_notifications")
    .delete()
    .in("id", staleIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function createUserNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("user_notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    metadata: params.metadata ?? {}
  });

  if (error) {
    throw new Error(error.message);
  }

  await trimUserNotifications(params.userId);
}

type AttemptLike = { created_at: string | null };

function getMostRecentStreakLength(attempts: AttemptLike[]) {
  const dates = [...new Set(
    attempts
      .map((attempt) => attempt.created_at)
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 10))
  )].sort();

  if (dates.length === 0) {
    return { lastActivityDate: null as string | null, mostRecentStreak: 0 };
  }

  let streak = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    const previous = new Date(`${dates[index - 1]}T00:00:00.000Z`);
    previous.setUTCDate(previous.getUTCDate() + 1);
    if (previous.toISOString().slice(0, 10) !== dates[index]) {
      break;
    }
    streak += 1;
  }

  return {
    lastActivityDate: dates[dates.length - 1],
    mostRecentStreak: streak
  };
}

export async function createNotificationsForAttempt(params: {
  userId: string;
  beforeAttempts: AttemptLike[];
  afterAttempts: AttemptLike[];
  beforeLevel: number;
  afterLevel: number;
  beforeBadgeIds: string[];
  afterBadgeIds: string[];
}) {
  const beforeStreak = calculateStreakStats(params.beforeAttempts).currentStreak;
  const afterStreak = calculateStreakStats(params.afterAttempts).currentStreak;

  if (afterStreak > beforeStreak && afterStreak > 0) {
    await createUserNotification({
      userId: params.userId,
      type: "streak_gained",
      title: afterStreak === 1 ? "Streak started" : "Streak extended",
      body:
        afterStreak === 1
          ? "You started a new practice streak. Come back tomorrow to keep it alive."
          : `You are now on a ${afterStreak}-day streak.`,
      metadata: { streak: afterStreak }
    });
  }

  if (params.afterLevel > params.beforeLevel) {
    for (let level = params.beforeLevel + 1; level <= params.afterLevel; level += 1) {
      await createUserNotification({
        userId: params.userId,
        type: "level_up",
        title: `Level ${level} reached`,
        body: `You reached ${getLevelName(level)}.`,
        metadata: { level }
      });
    }
  }

  const previousBadges = new Set(params.beforeBadgeIds);
  const newBadges = params.afterBadgeIds.filter((badgeId) => !previousBadges.has(badgeId));

  for (const badgeId of newBadges) {
    await createUserNotification({
      userId: params.userId,
      type: "badge_earned",
      title: `Badge earned: ${getBadgeName(badgeId)}`,
      body: getBadgeDescription(badgeId),
      metadata: { badgeId }
    });
  }
}

export async function ensureStreakLossNotification(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: attempts, error: attemptsError } = await supabase
    .from("worksheet_attempts")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (attemptsError) {
    throw new Error(attemptsError.message);
  }

  const stats = calculateStreakStats((attempts ?? []) as AttemptLike[]);
  const { lastActivityDate, mostRecentStreak } = getMostRecentStreakLength((attempts ?? []) as AttemptLike[]);

  if (!lastActivityDate || mostRecentStreak === 0 || stats.currentStreak > 0) {
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "streak_lost")
    .eq("metadata->>lastActivityDate", lastActivityDate)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return;
  }

  await createUserNotification({
    userId,
    type: "streak_lost",
    title: "Streak lost",
    body: `Your ${mostRecentStreak}-day streak has ended. Start a new one with another practice session.`,
    metadata: { lastActivityDate, streak: mostRecentStreak }
  });
}

export async function listUserNotifications(userId: string): Promise<UserNotification[]> {
  await ensureStreakLossNotification(userId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, type, title, body, metadata, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_NOTIFICATIONS);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as UserNotification[];
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
