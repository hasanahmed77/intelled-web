const DEFAULT_STREAK_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? "UTC";

function toCalendarDate(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftCalendarDate(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function calculateStreakStats(
  attempts: Array<{ created_at: string | null } | string | Date>,
  timeZone = DEFAULT_STREAK_TIME_ZONE
) {
  const uniqueDates = [...new Set(
    attempts
      .map((attempt) =>
        typeof attempt === "string" || attempt instanceof Date
          ? attempt
          : attempt.created_at
      )
      .filter((value): value is string | Date => Boolean(value))
      .map((value) => toCalendarDate(value, timeZone))
  )].sort();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null as string | null,
    };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    if (uniqueDates[index] === shiftCalendarDate(uniqueDates[index - 1], 1)) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  const today = toCalendarDate(new Date(), timeZone);
  const yesterday = shiftCalendarDate(today, -1);
  const lastActivityDate = uniqueDates[uniqueDates.length - 1];

  let currentStreak = 0;
  if (lastActivityDate === today || lastActivityDate === yesterday) {
    currentStreak = 1;
    let cursor = lastActivityDate;

    for (let index = uniqueDates.length - 2; index >= 0; index -= 1) {
      const expectedPrevious = shiftCalendarDate(cursor, -1);
      if (uniqueDates[index] !== expectedPrevious) {
        break;
      }
      currentStreak += 1;
      cursor = uniqueDates[index];
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastActivityDate,
  };
}
