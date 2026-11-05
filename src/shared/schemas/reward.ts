/**
 * schemas/reward.ts — daily login + reward_config wire types (Phase 2).
 *
 * reward_config is the single-row (id=1) table that configures all engagement
 * features. This file covers the daily-login portion + the overall config
 * shape. Leaderboard prizes and mission defaults are added in later phases.
 */
import { z } from 'zod';
import { leaderboardPrizesSchema } from './leaderboard';

/**
 * Daily login schedule. Keys are the streak day ("1".."30"), values are the
 * bonus OKN-points awarded for checking in on that day. `defaultAfter30` is the
 * reward for every day beyond 30 (the streak stays rewarding past the cap).
 *
 * JSON keys are strings because Postgres jsonb object keys are always text.
 */
export const dailyScheduleSchema = z.object({
  schedule: z.record(z.string(), z.number().int().nonnegative()),
  defaultAfter30: z.number().int().nonnegative(),
});
export type DailySchedule = z.infer<typeof dailyScheduleSchema>;

/**
 * Default daily schedule. Escalating base reward with milestone bumps at weekly
 * checkpoints (day 7/14/21) and a large day-30 reward. After day 30 the reward
 * stays at the day-30 level so a long streak keeps paying.
 */
export const DEFAULT_DAILY_SCHEDULE: DailySchedule = {
  schedule: {
    '1': 5,
    '2': 10,
    '3': 15,
    '4': 20,
    '5': 25,
    '6': 30,
    '7': 100, // week 1 milestone
    '8': 40,
    '9': 45,
    '10': 50,
    '11': 55,
    '12': 60,
    '13': 65,
    '14': 200, // week 2 milestone
    '15': 75,
    '16': 80,
    '17': 85,
    '18': 90,
    '19': 95,
    '20': 100,
    '21': 400, // week 3 milestone
    '22': 100,
    '23': 140,
    '24': 180,
    '25': 220,
    '26': 260,
    '27': 300,
    '28': 340,
    '29': 380,
    '30': 1000, // big monthly reward
  },
  defaultAfter30: 1000,
};

/**
 * Presale reward multiplier — the "growth engine" boost. Users who bought more
 * OKN in the presale get a multiplier on TASK points (referral bonuses inherit
 * the boost because awardReferralBonuses receives the already-multiplied value).
 *
 * Tiers are defined in OKN (wei, as string for bigint safety), NOT USD: OKN
 * amount is immutable at purchase time, so a tier once earned never flickers
 * with BNB price. The `label` is an admin-facing hint (e.g. "$100") and is not
 * shown to users. Tiers are evaluated highest-qualifying-first; a user with no
 * purchases gets multiplier 1 (no boost).
 *
 * Defaults approximate $100/$500/$2000 at a typical sale rate but are fully
 * admin-editable via the reward-config card without a deploy.
 */
export const presaleMultiplierTierSchema = z.object({
  minOkn: z.string(),
  multiplier: z.number().min(1),
  label: z.string().optional(),
});
export type PresaleMultiplierTier = z.infer<typeof presaleMultiplierTierSchema>;

export const presaleMultiplierSchema = z.object({
  tiers: z.array(presaleMultiplierTierSchema),
});
export type PresaleMultiplierConfig = z.infer<typeof presaleMultiplierSchema>;

/** Default tiers (OKN wei). Editable by admins. */
export const DEFAULT_PRESALE_MULTIPLIER: PresaleMultiplierConfig = {
  tiers: [
    // ~$100 equiv at a mid sale rate
    { minOkn: '830000000000000000000', multiplier: 1.5, label: '~$100' },
    // ~$500 equiv
    { minOkn: '4150000000000000000000', multiplier: 2, label: '~$500' },
    // ~$2000 equiv
    { minOkn: '16600000000000000000000', multiplier: 3, label: '~$2000' },
  ],
};

/**
 * The full reward_config row (single-row table, id=1). Each section is added by
 * its phase; all are optional except referralLevels (seeded in Phase 1).
 *
 * leaderboardPrizes is typed via the Phase 4 leaderboard schema
 * ({ weekly: {rank: pts}, monthly: {...} }); missionDefaults stays passthrough
 * until Phase 5 adds its typed shape.
 */
export const rewardConfigSchema = z.object({
  id: z.number().int(),
  referralLevels: z.object({
    level1Pct: z.number().int().min(0).max(100),
    level2Pct: z.number().int().min(0).max(100),
    level3Pct: z.number().int().min(0).max(100),
  }),
  dailySchedule: dailyScheduleSchema.nullable(),
  leaderboardPrizes: leaderboardPrizesSchema.nullable(),
  missionDefaults: z.unknown().nullable(),
  presaleMultiplier: presaleMultiplierSchema.nullable(),
  updatedAt: z.string(),
});
export type RewardConfig = z.infer<typeof rewardConfigSchema>;

/**
 * The user's current streak state (GET /api/rewards/streak). `nextReward` is the
 * points the user would earn by checking in today (null if already checked in).
 */
export const streakInfoSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  lastLoginDate: z.string().nullable(),
  totalLogins: z.number().int().nonnegative(),
  checkedInToday: z.boolean(),
  nextReward: z.number().int().nonnegative().nullable(),
  nextDay: z.number().int().positive().nullable(),
});
export type StreakInfo = z.infer<typeof streakInfoSchema>;

/**
 * Result of POST /api/rewards/check-in. `awarded=false` means the user already
 * checked in today; `points` is 0 in that case. `streakAfter` is the new streak
 * length (1 if the previous streak broke, or continued+1).
 */
export const checkInResultSchema = z.object({
  awarded: z.boolean(),
  day: z.number().int().positive().nullable(),
  points: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
});
export type CheckInResult = z.infer<typeof checkInResultSchema>;
