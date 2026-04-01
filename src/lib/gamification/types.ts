export interface Level {
  level: number;
  name: string;
  minXp: number;
  maxXp: number | null; // null for max level
}

export const LEVELS: Level[] = [
  { level: 1, name: "Novice",      minXp: 0,    maxXp: 99   },
  { level: 2, name: "Scholar",     minXp: 100,  maxXp: 249  },
  { level: 3, name: "Thinker",     minXp: 250,  maxXp: 499  },
  { level: 4, name: "Achiever",    minXp: 500,  maxXp: 899  },
  { level: 5, name: "Expert",      minXp: 900,  maxXp: 1399 },
  { level: 6, name: "Elite",       minXp: 1400, maxXp: 1999 },
  { level: 7, name: "Master",      minXp: 2000, maxXp: 2999 },
  { level: 8, name: "Legend",      minXp: 3000, maxXp: 4999 },
  { level: 9, name: "Super Saiyan",minXp: 5000, maxXp: null },
];

export function getLevelInfo(totalXp: number): {
  current: Level;
  next: Level | null;
  progressPct: number;
} {
  const current = [...LEVELS].reverse().find((l) => totalXp >= l.minXp) ?? LEVELS[0];
  const next = current.maxXp !== null ? LEVELS[current.level] ?? null : null;
  const progressPct =
    current.maxXp === null
      ? 100
      : Math.round(((totalXp - current.minXp) / (current.maxXp + 1 - current.minXp)) * 100);
  return { current, next, progressPct };
}

export interface WeeklyChallenge {
  index: number;
  title: string;
  description: string;
  goal: number;
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  { index: 0,  title: "Warm Up",          description: "Submit 5 problem sets this week.",              goal: 5  },
  { index: 1,  title: "High Scorer",       description: "Score 80% or higher on 3 problem sets.",        goal: 3  },
  { index: 2,  title: "Consistent",        description: "Maintain a 3-day practice streak.",             goal: 3  },
  { index: 3,  title: "Marathon",          description: "Submit 10 problem sets this week.",             goal: 10 },
  { index: 4,  title: "Perfectionist",     description: "Score 100% on a problem set.",                  goal: 1  },
  { index: 5,  title: "Above Average",     description: "Score 70% or higher on 5 problem sets.",        goal: 5  },
  { index: 6,  title: "Day Grinder",       description: "Submit 3 problem sets in a single day.",        goal: 3  },
  { index: 7,  title: "Excellence",        description: "Score 90% or higher on 5 problem sets.",        goal: 5  },
  { index: 8,  title: "Volume Seeker",     description: "Submit 7 problem sets this week.",              goal: 7  },
  { index: 9,  title: "Near Perfect",      description: "Score 85% or higher on 3 problem sets.",        goal: 3  },
  { index: 10, title: "Iron Will",         description: "Maintain a 5-day practice streak.",             goal: 5  },
  { index: 11, title: "Double Flawless",   description: "Score 100% on 2 problem sets this week.",       goal: 2  },
];

export function getCurrentWeekChallenge(): WeeklyChallenge {
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  const dow = monday.getUTCDay(); // 0 = Sun
  monday.setUTCDate(monday.getUTCDate() - ((dow + 6) % 7));

  const ref = new Date("2024-01-01T00:00:00Z"); // a Monday
  const weeksDiff = Math.floor((monday.getTime() - ref.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const idx = ((weeksDiff % 12) + 12) % 12;
  return WEEKLY_CHALLENGES[idx];
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_step",    name: "First Step",      description: "Submitted your first problem set.",         icon: "👣" },
  { id: "on_a_roll",     name: "On a Roll",        description: "Submitted 5 problem sets.",                 icon: "🎯" },
  { id: "century",       name: "Century",          description: "Submitted 100 problem sets.",               icon: "💯" },
  { id: "sharp_mind",    name: "Sharp Mind",       description: "Scored 80% or higher.",                     icon: "🧠" },
  { id: "perfectionist", name: "Perfectionist",    description: "Scored 100% on a problem set.",             icon: "⭐" },
  { id: "flawless",      name: "Flawless",         description: "Scored 100% on 3 problem sets.",            icon: "💎" },
  { id: "on_fire",       name: "On Fire",          description: "Reached a 3-day streak.",                   icon: "🔥" },
  { id: "unstoppable",   name: "Unstoppable",      description: "Reached a 7-day streak.",                   icon: "⚡" },
  { id: "immortal",      name: "Immortal",         description: "Reached a 30-day streak.",                  icon: "👑" },
  { id: "weekly_warrior",name: "Weekly Warrior",   description: "Completed a weekly challenge.",             icon: "🏆" },
  { id: "lvl_scholar",   name: "Scholar",          description: "Reached level 2: Scholar.",                 icon: "📚" },
  { id: "lvl_thinker",   name: "Thinker",          description: "Reached level 3: Thinker.",                 icon: "🤔" },
  { id: "lvl_achiever",  name: "Achiever",         description: "Reached level 4: Achiever.",                icon: "🎖️" },
  { id: "lvl_expert",    name: "Expert",           description: "Reached level 5: Expert.",                  icon: "🔬" },
  { id: "lvl_elite",     name: "Elite",            description: "Reached level 6: Elite.",                   icon: "🛡️" },
  { id: "lvl_master",    name: "Master",           description: "Reached level 7: Master.",                  icon: "⚔️" },
  { id: "lvl_legend",    name: "Legend",           description: "Reached level 8: Legend.",                  icon: "🌟" },
  { id: "lvl_supersaiyan",name:"Super Saiyan",     description: "Reached level 9: Super Saiyan.",            icon: "✨" },
];
