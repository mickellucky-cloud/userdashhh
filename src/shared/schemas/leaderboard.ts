/**
 * schemas/leaderboard.ts — Phase 4 leaderboard wire types.
 *
 * Three categories (referrals / tasks / buyers) across three periods
 * (weekly / monthly / all time). Weekly and monthly are snapshotted at the end
 * of each period and pay bonus prizes to top finishers; all_time is live.
 */
import { z } from 'zod';

export const leaderboardPeriodEnum = z.enum(['weekly', 'monthly', 'all_time']);
export type LeaderboardPeriod = z.infer<typeof leaderboardPeriodEnum>;

export const leaderboardCategoryEnum = z.enum(['referrals', 'tasks', 'buyers']);
export type LeaderboardCategory = z.infer<typeof leaderboardCategoryEnum>;

/** A single ranked entry. score is the metric (count of refs, points, BNB). */
export const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  score: z.string(), // numeric -> text on the wire
  isMe: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

/** The leaderboard response: the visible top-N plus the viewer's own rank. */
export const leaderboardResponseSchema = z.object({
  period: leaderboardPeriodEnum,
  category: leaderboardCategoryEnum,
  periodKey: z.string().nullable(), // null for all_time; 'YYYY-Www' / 'YYYY-MM' for live weekly/monthly
  entries: z.array(leaderboardEntrySchema),
  myRank: leaderboardEntrySchema.nullable(), // null if the user has no score / isn't ranked
});
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;

/** A past winner row from leaderboard_snapshots (+ the bonus they received). */
export const leaderboardWinnerSchema = z.object({
  period: leaderboardPeriodEnum,
  periodKey: z.string(),
  category: leaderboardCategoryEnum,
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  score: z.string(),
  pointsAwarded: z.number().int(),
  snapshotAt: z.string(),
});
export type LeaderboardWinner = z.infer<typeof leaderboardWinnerSchema>;

/**
 * Prize map for weekly/monthly winners. Keys are rank numbers as strings (jsonb
 * keys are text). Example: { "1": 500, "2": 300, "3": 200 }.
 */
export const prizeMapSchema = z.record(z.string(), z.number().int().nonnegative());
export type PrizeMap = z.infer<typeof prizeMapSchema>;

export const leaderboardPrizesSchema = z.object({
  weekly: prizeMapSchema,
  monthly: prizeMapSchema,
});
export type LeaderboardPrizes = z.infer<typeof leaderboardPrizesSchema>;

/** Default prize schedule. Weekly top-3, monthly top-5. */
export const DEFAULT_LEADERBOARD_PRIZES: LeaderboardPrizes = {
  weekly: { '1': 500, '2': 300, '3': 200 },
  monthly: { '1': 2000, '2': 1000, '3': 500, '4': 300, '5': 200 },
};
