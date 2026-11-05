/**
 * schemas/verifier.ts — @okn/verifier contracts.
 *
 * Shared between the verifier service, the web app, and the bot. These are the
 * single source of truth for which social platforms and actions exist, how each
 * action is verified (instant check, hold + recheck, or push event), and the
 * payloads of the verifier HTTP API.
 *
 * Platform capability research lives in docs/SOCIAL_TASK_VERIFICATION.md; the
 * verifier's provider registry (apps/verifier/src/engine/registry.ts) implements
 * what this module declares.
 */
import { z } from 'zod';

// === PLATFORMS ===
export const socialPlatformEnum = z.enum([
  'telegram',
  'x',
  'bluesky',
  'discord',
  'youtube',
  'facebook',
  'instagram',
  'threads',
  'medium',
  'truth_social',
]);
export type SocialPlatform = z.infer<typeof socialPlatformEnum>;

/**
 * Legacy platform aliases tolerated at the verifier boundary. Admin-created
 * tasks may predate the enum ('twitter' was common); we normalize instead of
 * rejecting so old rows keep verifying.
 */
export const SOCIAL_PLATFORM_ALIASES: Record<string, SocialPlatform> = {
  twitter: 'x',
  x_twitter: 'x',
  tg: 'telegram',
  bsky: 'bluesky',
  ig: 'instagram',
  th: 'threads',
  fb: 'facebook',
  yt: 'youtube',
  truths: 'truth_social',
};

// === ACTIONS ===
export const socialActionEnum = z.enum([
  'follow',
  'join_channel',
  'join_group',
  'retweet',
  'quote',
  'reply',
  'comment',
  'mention',
  'message',
  'react',
  'share',
  'boost',
  'subscribe',
  'like',
  'repost',
]);
export type SocialAction = z.infer<typeof socialActionEnum>;

// === VERIFICATION MODES ===
// instant: one passing check verifies.
// hold:    a passing check schedules a mandatory recheck after holdHours; only
//          the recheck finalizes (kills follow-then-unfollow farming).
// event:   the job waits for a pushed event (e.g. the bot forwarding a Telegram
//          group message); the runner never polls it.
export const verificationModeEnum = z.enum(['instant', 'hold', 'event']);
export type VerificationMode = z.infer<typeof verificationModeEnum>;

// === IDENTITY REQUIREMENTS ===
// none:      action needs no platform identity.
// inherited: identity comes from the OKN account itself (telegram_id).
// handle:    user submits a handle, the verifier resolves a canonical id.
// oauth:     user must link via that platform's OAuth.
export const identityRequirementEnum = z.enum(['none', 'inherited', 'handle', 'oauth']);
export type IdentityRequirement = z.infer<typeof identityRequirementEnum>;

// === TASK CONFIG EXTENSIONS (consumed inside taskConfigSchema) ===

/** Anti-farm quality gates, evaluated at identity link time AND verify time. */
export const taskQualityGatesSchema = z.object({
  minFollowers: z.number().int().min(0).optional(),
  minAccountAgeDays: z.number().int().min(0).optional(),
  minCommentLength: z.number().int().min(0).max(2000).optional(),
  requireProfilePhoto: z.boolean().optional(),
});
export type TaskQualityGates = z.infer<typeof taskQualityGatesSchema>;

/**
 * Structured target of a social task. Verifier modules read the fields they
 * care about and fall back to service-level defaults (e.g. the configured
 * Telegram chat ids) when absent.
 */
export const taskTargetRefSchema = z
  .object({
    url: z.string().url().optional(),
    // X
    tweetId: z.string().optional(),
    username: z.string().optional(),
    // Telegram
    chatId: z.string().optional(),
    messageId: z.string().optional(),
    // Bluesky
    postUri: z.string().optional(),
    // YouTube
    videoId: z.string().optional(),
    channelId: z.string().optional(),
    // Meta (IG/Threads/FB)
    mediaId: z.string().optional(),
    postId: z.string().optional(),
    // Free-text matching (message/comment keyword, hashtag)
    keyword: z.string().optional(),
    hashtag: z.string().optional(),
  })
  .passthrough();
export type TaskTargetRef = z.infer<typeof taskTargetRefSchema>;

// === CAPABILITY MATRIX (GET /v1/capabilities) ===
export const capabilitySchema = z.object({
  platform: socialPlatformEnum,
  action: socialActionEnum,
  mode: verificationModeEnum,
  identityRequirement: identityRequirementEnum,
  /** True when the platform has no api-verifiable actions at all. */
  manualOnly: z.boolean().default(false),
  // -- Env-aware gating (additive; old clients ignore these) --
  /** Whether the verifier's credentials for THIS action are present. */
  configurable: z.boolean().default(true),
  /** Env var names currently absent for this action. */
  missingEnv: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type Capability = z.infer<typeof capabilitySchema>;

/** One platform's entry in the runtime capability matrix. */
export const platformCapabilitiesSchema = z.object({
  platform: socialPlatformEnum,
  /** implemented = provider module registered; manual = manual-only; planned = module not shipped. */
  status: z.enum(['implemented', 'manual', 'planned']),
  manualOnly: z.boolean(),
  supportsHandleLinking: z.boolean(),
  /** Platform-level credential presence (all platform-required env vars set). */
  configured: z.boolean().default(true),
  /** Env var names absent at platform level. */
  missingEnv: z.array(z.string()).default([]),
  actions: z.array(capabilitySchema),
});
export type PlatformCapabilitiesDto = z.infer<typeof platformCapabilitiesSchema>;

export const capabilitiesResponseSchema = z.object({
  platforms: z.array(platformCapabilitiesSchema),
  generatedAt: z.string(),
});
export type CapabilitiesResponse = z.infer<typeof capabilitiesResponseSchema>;

// === JOB STATUS ===
export const verificationJobStatusEnum = z.enum([
  'queued',
  'running',
  'verified',
  'not_met',
  'retry',
  'failed',
  'expired',
  'canceled',
]);
export type VerificationJobStatus = z.infer<typeof verificationJobStatusEnum>;

export const verificationPhaseEnum = z.enum(['initial', 'hold_recheck']);
export type VerificationPhase = z.infer<typeof verificationPhaseEnum>;

// === HTTP API PAYLOADS ===

/** POST /v1/verify (web -> verifier, after a pending api-method completion). */
export const verifyRequestSchema = z.object({
  completionId: z.string().uuid(),
});
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

/** GET /v1/jobs/:id response. */
export const verificationJobSchema = z.object({
  id: z.string().uuid(),
  completionId: z.string().uuid(),
  userId: z.string().uuid(),
  taskId: z.string().uuid(),
  platform: socialPlatformEnum,
  action: socialActionEnum,
  phase: verificationPhaseEnum,
  status: verificationJobStatusEnum,
  attempts: z.number().int(),
  nextRunAt: z.date().nullable(),
  holdUntil: z.date().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  checkedAt: z.date().nullable(),
  awardSyncedAt: z.date().nullable(),
});
export type VerificationJob = z.infer<typeof verificationJobSchema>;

/** POST /v1/identities/:platform (user JWT). */
export const linkIdentityInputSchema = z.object({
  handle: z.string().min(2).max(80),
});
export type LinkIdentityInput = z.infer<typeof linkIdentityInputSchema>;

/** Normalized Telegram message event pushed by the bot. */
export const telegramEventSchema = z.object({
  chatId: z.string(),
  fromTelegramId: z.string(),
  messageId: z.number().int(),
  text: z.string().default(''),
  date: z.number().int(),
  replyToMessageId: z.number().int().nullable().default(null),
});
export type TelegramEvent = z.infer<typeof telegramEventSchema>;

/** POST /v1/admin/validate-task (admin JWT). */
export const validateTaskInputSchema = z.object({
  platform: z.string(),
  action: z.string().optional(),
  verificationMethod: z.string().optional(),
});
export type ValidateTaskInput = z.infer<typeof validateTaskInputSchema>;

export const taskValidationResultSchema = z.object({
  valid: z.boolean(),
  platform: socialPlatformEnum.nullable(),
  action: socialActionEnum.nullable(),
  mode: verificationModeEnum.nullable(),
  manualOnly: z.boolean(),
  /** True when the combo is real but the verifier lacks credentials for it. */
  notConfigured: z.boolean().default(false),
  /** Env var names absent (only meaningful when notConfigured is true). */
  missingEnv: z.array(z.string()).default([]),
  issues: z.array(z.string()),
});
export type TaskValidationResult = z.infer<typeof taskValidationResultSchema>;
