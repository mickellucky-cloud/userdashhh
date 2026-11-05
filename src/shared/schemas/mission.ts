/**
 * schemas/mission.ts — Phase 5 community mission wire types.
 *
 * Collective-goal missions: "when the community reaches X, every eligible user
 * gets Y OKN points". Admin defines (metric, threshold, reward); the hourly
 * cron job watches the metric and bulk-distributes on first achievement.
 */
import { z } from 'zod';

export const communityMetricEnum = z.enum([
  'user_count',
  'telegram_members',
  'total_bnb',
  'total_okn_claimed',
]);
export type CommunityMetric = z.infer<typeof communityMetricEnum>;

export const missionStatusEnum = z.enum(['active', 'achieved', 'distributed']);
export type MissionStatus = z.infer<typeof missionStatusEnum>;

/** Admin input when creating a mission. */
export const createMissionInputSchema = z.object({
  metric: communityMetricEnum,
  threshold: z.union([z.number(), z.string()]).transform((v) => String(v)),
  rewardPerUser: z.number().int().positive(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});
export type CreateMissionInput = z.infer<typeof createMissionInputSchema>;

/** Admin input when updating a mission (only allowed while status='active'). */
export const updateMissionInputSchema = z.object({
  threshold: z.union([z.number(), z.string()]).transform((v) => String(v)).optional(),
  rewardPerUser: z.number().int().positive().optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  // status flip is admin-triggered (e.g. manual cancel) — restricted values only.
  status: z.enum(['active']).optional(),
});
export type UpdateMissionInput = z.infer<typeof updateMissionInputSchema>;

/** A mission row as returned to the client. */
export const missionSchema = z.object({
  id: z.string().uuid(),
  metric: communityMetricEnum,
  threshold: z.string(), // numeric -> text
  rewardPerUser: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: missionStatusEnum,
  eligibilityCutoff: z.string().nullable(), // ISO ts
  achievedAt: z.string().nullable(),
  distributedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Mission = z.infer<typeof missionSchema>;

/**
 * Mission with live progress + whether the viewer has received the reward.
 * Used by the user-facing GET /api/missions.
 */
export const missionWithProgressSchema = missionSchema.extend({
  /** Current metric value (live). numeric -> text. */
  currentValue: z.string(),
  /** 0-100 progress toward the threshold (capped). */
  progressPct: z.number().min(0).max(100),
  /** Whether the requesting user is/was eligible (joined by eligibility_cutoff). */
  eligible: z.boolean(),
  /** Whether the user already received the reward (mission_distributions row). */
  received: z.boolean(),
});
export type MissionWithProgress = z.infer<typeof missionWithProgressSchema>;
