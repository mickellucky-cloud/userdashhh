import { z } from 'zod';
import { taskQualityGatesSchema, taskTargetRefSchema } from './verifier';

// Mirrors apps/smartContract/contracts/OKNToken.sol config + task config jsonb
export const taskTypeEnum = z.enum([
  'social_follow',
  'social_post',
  'referral',
  'quiz',
  'custom',
]);
export type TaskType = z.infer<typeof taskTypeEnum>;

export const taskVerificationMethodEnum = z.enum([
  'manual',
  'api',
  'url_click',
  'quiz_pass',
]);
export type TaskVerificationMethod = z.infer<typeof taskVerificationMethodEnum>;

export const taskConfigSchema = z
  .object({
    // Free string on purpose: legacy tasks predate the social platform enum.
    // The verifier normalizes via SOCIAL_PLATFORM_ALIASES and validates
    // strictly at its own boundary (unknown platforms fail closed there,
    // not here where a parse failure would flip legacy rows to 'manual').
    platform: z.string().optional(),
    // Social action for verifier-routed tasks; strict enum lives in
    // schemas/verifier.ts and is enforced by the verifier service.
    action: z.string().optional(),
    url: z.string().url().optional(),
    verificationMethod: taskVerificationMethodEnum.default('manual'),
    // Verifier extensions (schemas/verifier.ts). Optional so every legacy
    // task config still parses.
    targetRef: taskTargetRefSchema.optional(),
    qualityGates: taskQualityGatesSchema.optional(),
    // Hold window in hours for follow/join style actions (default 72h).
    holdHours: z.number().int().min(0).max(720).optional(),
    quizQuestions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).min(2),
          correctIndex: z.number().int().min(0),
        }),
      )
      .optional(),
  })
  .passthrough();
export type TaskConfig = z.infer<typeof taskConfigSchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  type: taskTypeEnum,
  rewardPoints: z.number().int().positive(),
  config: taskConfigSchema,
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = taskSchema
  .omit({ id: true, createdAt: true })
  .extend({
    description: z.string().nullable().optional(),
  });
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

/**
 * Partial update for PATCH /api/admin/tasks/[id]. Every field is optional; the
 * route applies only those present. isActive stays here so the existing toggle
 * path keeps working through the same schema.
 */
export const updateTaskInputSchema = createTaskInputSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const taskCompletionStatusEnum = z.enum(['pending', 'verified', 'rejected']);
export type TaskCompletionStatus = z.infer<typeof taskCompletionStatusEnum>;

export const taskCompletionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: taskCompletionStatusEnum.default('pending'),
  proofData: z.record(z.unknown()).nullable(),
  completedAt: z.date(),
  verifiedAt: z.date().nullable(),
  // Admin's explanation for a rejection, shown to the user in their
  // notification. Null for verified/pending completions and rejects without a
  // reason.
  rejectionReason: z.string().nullable().default(null),
});
export type TaskCompletion = z.infer<typeof taskCompletionSchema>;

// POST /api/tasks/[id]/complete
export const completeTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  proofData: z.record(z.unknown()).optional().default({}),
});
export type CompleteTaskInput = z.infer<typeof completeTaskInputSchema>;
