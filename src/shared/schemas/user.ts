import { z } from 'zod';

// === USER ===
export const telegramUserSchema = z.object({
  telegramId: z.number().int().positive(),
  username: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
});
export type TelegramUser = z.infer<typeof telegramUserSchema>;

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
  .transform((v) => v.toLowerCase() as `0x${string}`);

// Admin role enum mirrors the DB admin_role column + apps/web/src/lib/auth/permissions.ts
export const adminRoleSchema = z.enum([
  'super_admin',
  'admin',
  'moderator',
  'support',
]);
export type AdminRole = z.infer<typeof adminRoleSchema>;

/**
 * Ordered admin roles (descending privilege). Single source of truth —
 * apps/web/src/lib/auth/permissions.ts and apps/bot/src/services/jwt.ts import
 * this instead of redeclaring it, so a future role add/rename cannot diverge.
 */
export const ADMIN_ROLES = adminRoleSchema.options as readonly [AdminRole, ...AdminRole[]];

export const userSchema = z.object({
  id: z.string().uuid(),
  telegramId: z.bigint().nullable(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  photoUrl: z.string().nullable(),
  email: z.string().nullable(),
  emailVerifiedAt: z.date().nullable(),
  walletAddress: walletAddressSchema.nullable(),
  adminRole: adminRoleSchema.nullable().default(null),
  signupMethod: z.enum(['telegram', 'wallet']).default('telegram'),
  walletRewardClaimed: z.boolean().default(false),
  telegramRewardClaimed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

/**
 * POST /api/profile — user self-edits their display name and/or binds an email.
 * Telegram identity (id, username, photo_url) comes from Telegram login; this
 * route handles only the user-editable fields. Email is stored but not yet
 * verified (emailVerifiedAt stays null until a verification pipeline ships).
 */
export const updateProfileInputSchema = z.object({
  firstName: z.string().trim().min(1).max(64).optional(),
  lastName: z.string().trim().max(64).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

// Bind-wallet payload (signed by the wallet per EIP-191, verified server-side)
export const bindWalletInputSchema = z.object({
  address: walletAddressSchema,
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature hex')
    .transform((v) => v as `0x${string}`),
  message: z.string().min(1),
});
export type BindWalletInput = z.infer<typeof bindWalletInputSchema>;

// Wallet-first login / signup input
export const walletLoginInputSchema = z.object({
  address: walletAddressSchema,
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature hex')
    .transform((v) => v as `0x${string}`),
  message: z.string().min(1),
});
export type WalletLoginInput = z.infer<typeof walletLoginInputSchema>;

export function buildWalletLoginMessage(
  address: string,
  timestamp: number,
  chainId: number,
): string {
  return [
    'Sign in to OKNexus',
    '',
    `Wallet: ${address.toLowerCase()}`,
    `Timestamp: ${timestamp}`,
    `Chain ID: ${chainId}`,
    '',
    'This signature does not cost any gas fees.',
  ].join('\n');
}

// Telegram bind payload via Telegram Login Widget
export const bindTelegramInputSchema = z.object({
  authData: z.record(z.union([z.string(), z.number()])),
});
export type BindTelegramInput = z.infer<typeof bindTelegramInputSchema>;

// === WALLET REBIND (Q-G policy — admin approval, signature from NEW wallet) ===

export const rebindReasonSchema = z.enum([
  'lost_key',
  'compromised',
  'upgrade',
  'admin_fix',
]);
export type RebindReason = z.infer<typeof rebindReasonSchema>;

/**
 * POST /api/wallet/rebind — user submits a rebind request.
 *
 * Policy (Q-G):
 *   - Proof = EIP-191 signature from the NEW wallet over `message`.
 *     Requiring the OLD wallet too would block legitimate lost-key recovery.
 *   - Cooldown: 1 rebind per 30 days (enforced server-side by checking the
 *     last `wallet_rebind_requests.created_at` for the user).
 *   - Status starts 'pending'. Moderator+ approves/rejects in /admin/users/[id]/rebind.
 */
export const walletRebindInputSchema = z.object({
  newWallet: walletAddressSchema,
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature hex')
    .transform((v) => v as `0x${string}`),
  message: z.string().min(1),
  reason: rebindReasonSchema,
});
export type WalletRebindInput = z.infer<typeof walletRebindInputSchema>;

/**
 * POST /api/admin/role — moderator approves or rejects a rebind request.
 * `action: 'approve'` swaps the user's wallet_address to newWallet and flags
 * the user for inclusion in the next Merkle root (the new address is what
 * future claims will be credited to).
 */
export const rebindDecisionSchema = z.object({
  action: z.enum(['approve', 'reject']),
});
export type RebindDecision = z.infer<typeof rebindDecisionSchema>;

/**
 * POST /api/admin/create-admin — super_admin pre-seeds an admin user by
 * Telegram ID (or promotes an existing user to an admin role).
 *
 * Telegram ID is the immutable identity. Optional username/firstName are
 * stored for display only. The new admin authenticates normally via the
 * Telegram bot the first time, at which point their initData links to this
 * pre-seeded row and they already have the admin role.
 *
 * If a user with the given telegram_id already exists:
 *   - If their current admin_role is null OR a LOWER-privilege role → promote.
 *   - If they are already a super_admin → refuse (don't silently demote an
 *     existing super admin via this path; use the dedicated /api/admin/role
 *     demote flow instead, which has its own guardrails).
 */
export const createAdminInputSchema = z.object({
  telegramId: z
    .string()
    .regex(/^\d+$/, 'Telegram ID must be a positive integer (digits only)'),
  username: z.string().optional(),
  firstName: z.string().optional(),
  role: adminRoleSchema,
});
export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;

/**
 * POST /api/admin/remove-admin — super_admin strips admin privileges from a
 * user (sets admin_role = NULL). The user keeps their account, points, and
 * wallet binding; they just lose /admin/* access. This is the inverse of the
 * promote flow.
 *
 * Guardrails (enforced server-side):
 *   - Cannot remove yourself (you'd lock yourself out).
 *   - Cannot remove the last remaining super_admin (system would have no
 *     super admin left to manage roles).
 *   - Refuses if the target is not currently an admin (idempotent no-op).
 */
export const removeAdminInputSchema = z.object({
  userId: z.string().uuid(),
});
export type RemoveAdminInput = z.infer<typeof removeAdminInputSchema>;
