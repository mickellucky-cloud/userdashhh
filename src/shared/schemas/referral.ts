/**
 * schemas/referral.ts — multi-level referral wire types.
 *
 * The referrals table stores up to 3 edges per referred user (one per ancestor
 * depth: 1 = direct, 2 = inviter's inviter, 3 = one more up). These schemas
 * describe the API payload returned by GET /api/referral and the reward_config
 * knobs that control how much of a referee's task points flow to each tier.
 */
import { z } from 'zod';

export const referralStatusEnum = z.enum(['pending', 'eligible', 'paid']);
export type ReferralStatus = z.infer<typeof referralStatusEnum>;

/** A single referred user row in the current user's downline (one per level). */
export const referralEntrySchema = z.object({
  id: z.string().uuid(),
  level: z.number().int().min(1).max(3),
  status: referralStatusEnum,
  rewardPoints: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  referredUsername: z.string().nullable(),
  referredFirstName: z.string().nullable(),
});
export type ReferralEntry = z.infer<typeof referralEntrySchema>;

/** Per-level aggregate used by the referral dashboard cards. */
export const referralLevelSummarySchema = z.object({
  level: z.number().int().min(1).max(3),
  count: z.number().int().nonnegative(),
  pointsEarned: z.number().int().nonnegative(),
});
export type ReferralLevelSummary = z.infer<typeof referralLevelSummarySchema>;

/**
 * Full referral payload. `levels[0]` is the direct (L1) downline, etc. The
 * `recent` list is the most recent referees across all levels for the activity
 * feed. Top-level `count` / `pointsEarned` sum across all levels for back-compat
 * with the existing single-level UI.
 */
export const referralInfoSchema = z.object({
  link: z.string().url(),
  count: z.number().int().nonnegative(),
  pointsEarned: z.number().int().nonnegative(),
  levels: z.tuple([
    referralLevelSummarySchema,
    referralLevelSummarySchema,
    referralLevelSummarySchema,
  ]),
  recent: z.array(referralEntrySchema),
});
export type ReferralInfo = z.infer<typeof referralInfoSchema>;

/**
 * reward_config.referral_levels shape. Percentages of a referee's verified task
 * points paid to each upline tier. Stored as ints (10/5/2) and divided by 100
 * when computing the award.
 */
export const referralLevelsConfigSchema = z.object({
  level1Pct: z.number().int().min(0).max(100),
  level2Pct: z.number().int().min(0).max(100),
  level3Pct: z.number().int().min(0).max(100),
});
export type ReferralLevelsConfig = z.infer<typeof referralLevelsConfigSchema>;

export const DEFAULT_REFERRAL_LEVELS: ReferralLevelsConfig = {
  level1Pct: 10,
  level2Pct: 5,
  level3Pct: 2,
};
