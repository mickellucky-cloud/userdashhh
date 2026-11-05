import { z } from 'zod';

// === CLAIM LEDGER ===
export const claimSourceEnum = z.enum(['task', 'referral', 'bonus', 'admin']);
export type ClaimSource = z.infer<typeof claimSourceEnum>;

export const claimLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  source: claimSourceEnum,
  sourceId: z.string().uuid().nullable(),
  points: z.number().int(),
  committed: z.boolean().default(false),
  merkleBatchId: z.string().uuid().nullable(),
  createdAt: z.date(),
});
export type ClaimLedgerEntry = z.infer<typeof claimLedgerEntrySchema>;

// === MERKLE ROOTS ===
/**
 * merkle_root_status lifecycle (CRIT #4 confirmation gate):
 *   broadcasting         → row inserted, on-chain tx NOT yet broadcast
 *   pending_confirmation → testnet: tx broadcast, awaiting block confirmation
 *   pending_safe         → mainnet: calldata prepared for Safe, awaiting on-chain RootUpdated
 *   committed            → on-chain tx confirmed AND ledger marked committed
 *   failed               → broadcast failed, reverted, or stale beyond grace window
 */
export const merkleRootStatusEnum = z.enum([
  'broadcasting',
  'pending_confirmation',
  'committed',
  'pending_safe',
  'failed',
]);
export type MerkleRootStatus = z.infer<typeof merkleRootStatusEnum>;

export const merkleRootSchema = z.object({
  id: z.string().uuid(),
  batchNumber: z.number().int().positive(),
  rootVersion: z.number().int().nonnegative(),
  rootHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid bytes32'),
  leafCount: z.number().int().nonnegative(),
  totalLifetimePoints: z.bigint(),
  txHash: z.string().nullable(),
  committedBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  status: merkleRootStatusEnum,
  lastTransitionAt: z.date(),
  confirmedAt: z.date().nullable(),
  failureReason: z.string().nullable(),
});
export type MerkleRoot = z.infer<typeof merkleRootSchema>;

// === CLAIMS ===
export const claimRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  rootVersion: z.number().int().nonnegative(),
  cumulativeEntitlement: z.bigint(),
  amountClaimed: z.bigint(),
  feePaid: z.bigint().default(0n),
  txHash: z.string().nullable(),
  claimedAt: z.date(),
});
export type ClaimRecord = z.infer<typeof claimRecordSchema>;

// GET /api/claims/proof — request + response
export const claimProofRequestSchema = z.object({
  rootVersion: z.number().int().nonnegative(),
});
export type ClaimProofRequest = z.infer<typeof claimProofRequestSchema>;

export const claimProofResponseSchema = z.object({
  account: z.string(),
  cumulativeEntitlement: z.bigint(),
  proof: z.array(z.string().regex(/^0x[a-fA-F0-9]{64}$/)),
});
export type ClaimProofResponse = z.infer<typeof claimProofResponseSchema>;
