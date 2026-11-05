import type {
  TaskType,
  TaskVerificationMethod,
  TaskCompletionStatus,
  ClaimSource,
} from '../schemas/index';

// === Enriched domain types (not validation schemas) ===

// AdminRole lives in schemas/user.ts (zod-derived, 4-tier). Do not redeclare here.

export interface ChainEvent {
  id: string;
  contractAddress: string;
  eventName: string;
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
  blockTimestamp: Date;
  args: Record<string, unknown>;
  indexedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  rewardPoints: number | null;
  status: 'pending' | 'eligible' | 'paid';
  createdAt: Date;
}

export interface WalletRebindRequest {
  id: string;
  userId: string;
  oldWallet: string;
  newWallet: string;
  reason: 'lost_key' | 'compromised' | 'upgrade' | 'admin_fix' | null;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  proofData: Record<string, unknown> | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  txHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Re-export enums-as-types for convenience
export type {
  TaskType,
  TaskVerificationMethod,
  TaskCompletionStatus,
  ClaimSource,
};
