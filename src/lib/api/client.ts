/**
 * api/client.ts — Phase 5
 * Typed API client for calling Next.js route handlers from the browser.
 *
 * Wire types: Postgres numeric/bigint columns cross the wire as strings,
 * dates as ISO strings. Keep these in sync with the route handlers.
 */
import type {
  Task,
  TaskCompletion,
  TaskCompletionStatus,
  TaskType,
  Purchase,
  SaleConfig,
  ClaimProofResponse,
  AdminRole,
  StreakInfo,
  CheckInResult,
  RewardConfig,
  LeaderboardResponse,
  LeaderboardWinner,
  LeaderboardPeriod,
  LeaderboardCategory,
  Mission,
  MissionWithProgress,
  CommunityMetric,
  CreateMissionInput,
  UpdateProfileInput,
} from '@okn/shared';

// Re-export the reward wire types so hooks/components can import them from the
// api client alongside the rest of the wire surface.
export type { StreakInfo, CheckInResult, RewardConfig };

// Phase 4 — leaderboard wire types.
export type {
  LeaderboardResponse,
  LeaderboardWinner,
  LeaderboardPeriod,
  LeaderboardCategory,
};

// Phase 5 — community mission wire types.
export type {
  Mission,
  MissionWithProgress,
  CommunityMetric,
  CreateMissionInput,
};

/** Admin mission row with the live metric value + payout projection. */
export interface AdminMission extends Mission {
  currentValue: string;
  eligibleUsers: number;
  projectedPayout: number;
}

/**
 * Phase 3 — aggregated portfolio. wei values cross the wire as strings (matches
 * the rest of the wire surface); points are plain ints.
 */
export interface Portfolio {
  /** Sum of OKN purchased (wei). */
  totalBought: string;
  /** Sum of OKN claimed on-chain (wei). */
  totalClaimed: string;
  /** Lifetime points earned across all sources. */
  totalEarned: number;
  /** Per-source point breakdown. Keys: task, referral, bonus, admin. */
  earnedBySource: { task: number; referral: number; bonus: number; admin: number };
  /** Per-level referral downline counts. */
  referralLevels: { l1: number; l2: number; l3: number };
  /** Current sale rate (OKN wei per 1 BNB wei) for the portfolio-value proxy. */
  saleRate: string;
}

export class ApiError extends Error {
  /** Optional structured details (e.g. zod field errors) from the server. */
  details?: unknown;
  constructor(public status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

/**
 * Generic, user-safe messages for common HTTP statuses. Used as a last-resort
 * fallback so a toast never shows raw HTML, an empty string, or internal text.
 * English only (see AGENTS.md).
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'You need to sign in',
  403: 'You do not have permission to do that',
  404: 'Not found',
  409: 'That action conflicts with existing data',
  422: 'Some of the details were invalid',
  429: 'Too many requests, please try again shortly',
  500: 'Something went wrong on our end',
  502: 'Service is temporarily unavailable',
  503: 'Service is temporarily unavailable',
  504: 'The request timed out',
};

/**
 * Turn a non-OK Response into a clean [message, details?] pair.
 *
 * Servers respond with a JSON envelope `{ error: string, details?: unknown }`.
 * An unwrapped crash, however, yields an HTML error page or an empty body —
 * which must never reach a toast verbatim. We therefore parse JSON when we can
 * (extracting the curated `error` string), and otherwise fall back to a
 * status-based generic message.
 */
export async function extractError(res: Response): Promise<[string, unknown?]> {
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      const body = JSON.parse(text) as unknown;
      if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (typeof obj.error === 'string' && obj.error.trim()) {
          return [obj.error, obj.details];
        }
      }
    } catch {
      // Body wasn't JSON (e.g. an HTML 500 page) — fall through to a safe generic.
    }
  }
  return [STATUS_MESSAGES[res.status] ?? res.statusText ?? `Request failed (${res.status})`];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const [message, details] = await extractError(res);
    throw new ApiError(res.status, message, details);
  }
  return (await res.json()) as T;
}

// === Wire types ===

// AdminRole now imported from @okn/shared (single source of truth, DEFECT 12).
// AdminRoleName is kept as a backward-compatible alias for the wire type.
export type AdminRoleName = AdminRole;

/** Page-based list envelope (G5): one numbered page + the filtered total. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ReferralStatus = 'pending' | 'eligible' | 'paid';

export type TaskWithStatus = Task & { completionStatus: TaskCompletionStatus | null };

export interface MeUser {
  id: string;
  telegramId: string | null;
  signupMethod?: 'telegram' | 'wallet';
  walletRewardClaimed?: boolean;
  telegramRewardClaimed?: boolean;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  walletAddress: string | null;
  walletBoundAt: string | null;
  adminRole: AdminRoleName | null;
  twoFactorEnabled: boolean;
  createdAt: string;
}

/** One tier of the user's multi-level downline (level 1/2/3). */
export interface ReferralLevelSummary {
  level: 1 | 2 | 3;
  count: number;
  pointsEarned: number;
}

/** A recent direct (L1) referee shown in the activity feed. */
export interface ReferralEntry {
  id: string;
  level: number;
  status: ReferralStatus;
  rewardPoints: number | null;
  createdAt: string;
  referredUsername: string | null;
  referredFirstName: string | null;
}

export interface ReferralInfo {
  link: string;
  /** Total across all 3 levels. Kept for back-compat with the single-level UI. */
  count: number;
  /** Sum of this user's source='referral' ledger points (exact). */
  pointsEarned: number;
  /** Per-level breakdown. Always a 3-tuple (L1, L2, L3). */
  levels: [ReferralLevelSummary, ReferralLevelSummary, ReferralLevelSummary];
  /** Most recent direct (L1) referees. */
  recent: ReferralEntry[];
}

export interface AdminStats {
  users: number;
  bnbRaised: string;
  oknSold: string;
  purchaseCount: number;
  oknClaimed: string;
  claimCount: number;
  // Live on-chain token supply (null when the chain/contract is unreachable).
  circulating: string | null;
  communityMinted: string | null;
  saleMinted: string | null;
}

export interface AdminUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  walletAddress: string | null;
  walletBoundAt: string | null;
  adminRole: AdminRoleName | null;
  /** Moderation lifecycle: active | suspended | banned (G7). */
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
  tokenVersion: number;
  bannedAt: string | null;
  bannedBy: string | null;
  banReason: string | null;
  deletedAt: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  points: number;
  /** Total downline size across all 3 referral levels. */
  referralCount: number;
  /** The L1 referrer of this user (who invited them), or null if organic. */
  referredBy: { userId: string; label: string | null } | null;
}

export interface AdminClaimItem {
  id: string;
  userId: string;
  rootVersion: number;
  cumulativeEntitlement: string;
  amountClaimed: string;
  feePaid: string;
  txHash: string | null;
  claimedAt: string;
  username: string | null;
  firstName: string | null;
}

export interface AdminClaimsResponse {
  summary: {
    totalClaimed: string;
    claimCount: number;
    uncommittedPoints: number;
    pendingCompletions: number;
  };
  claims: Page<AdminClaimItem>;
}

export interface AdminCompletion {
  id: string;
  userId: string;
  taskId: string;
  status: TaskCompletionStatus;
  proofData: Record<string, unknown> | null;
  completedAt: string;
  verifiedAt: string | null;
  taskTitle: string;
  rewardPoints: number;
  username: string | null;
  firstName: string | null;
}

export type AdminTask = Task & { completionCount: number };

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  type: TaskType;
  rewardPoints: number;
  config: {
    url?: string;
    verificationMethod: 'manual' | 'api' | 'url_click' | 'quiz_pass';
    /** Social platform id (SOCIAL_TASK_MATRIX / socialPlatformEnum). */
    platform?: string;
    /** Social action id, e.g. join_group, retweet. */
    action?: string;
    /** Structured target; keyword for content-matching tasks. */
    targetRef?: { keyword?: string; chatId?: string };
  };
  isActive?: boolean;
}

/** Partial of CreateTaskInput for PATCH /api/admin/tasks/[id]. */
export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  txHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  adminUsername: string | null;
  adminFirstName: string | null;
}

/**
 * A merkle_roots history row (GET /api/admin/merkle-roots). Mirrors the lifecycle
 * status enum: broadcasting → pending_confirmation/pending_safe → committed/failed.
 * The heavy `tree` jsonb is intentionally NOT included (proofs come from
 * /api/claims/proof); this type is for the commit-history table only.
 */
export type MerkleRootStatus =
  | 'broadcasting'
  | 'pending_confirmation'
  | 'committed'
  | 'pending_safe'
  | 'failed';

export interface MerkleRootHistoryItem {
  id: string;
  rootVersion: number;
  rootHash: string;
  leafCount: number;
  totalLifetimePoints: string;
  txHash: string | null;
  committedBy: string | null;
  createdAt: string;
  status: MerkleRootStatus;
  confirmedAt: string | null;
  failureReason: string | null;
  adminUsername: string | null;
  adminFirstName: string | null;
}

// === Admin monitoring surfaces (activity / purchases / overview / system / email / referrals) ===

/**
 * One user_activity_logs row joined with the acting user. ipAddress/userAgent
 * are present ONLY when the requester is admin level or above; support and
 * moderator receive rows without these keys at all (the UI hides the columns
 * from their absence in the payload).
 */
export interface AdminActivityItem {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  username: string | null;
  firstName: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** One email_log delivery record (user link nullable). */
export interface AdminEmailLogItem {
  id: string;
  userId: string | null;
  toAddress: string;
  template: string;
  providerMessageId: string | null;
  status: string;
  sentAt: string;
  username: string | null;
  firstName: string | null;
}

/** One purchases row; userId is null for wallets that never bound a user. */
export interface AdminPurchaseItem {
  id: string;
  userId: string | null;
  buyerWallet: string;
  bnbAmount: string;
  oknAmount: string;
  rate: string;
  txHash: string;
  blockNumber: string | null;
  createdAt: string;
  username: string | null;
  firstName: string | null;
}

/** Aggregated buyer wallet in the purchases summary block. */
export interface AdminTopBuyer {
  buyerWallet: string;
  username: string | null;
  totalBnb: string;
  totalOkn: string;
  buyCount: number;
}

export interface AdminPurchasesResponse {
  summary: { topBuyers: AdminTopBuyer[] };
  purchases: Page<AdminPurchaseItem>;
}

/** Per-user 360 overview: every section total in one payload. */
export interface AdminUserOverview {
  user: AdminUser;
  points: { committed: number; uncommitted: number };
  purchases: {
    totalBnb: string;
    totalOkn: string;
    count: number;
    recent: Array<{
      id: string;
      buyerWallet: string;
      bnbAmount: string;
      oknAmount: string;
      txHash: string | null;
      createdAt: string;
    }>;
  };
  claims: {
    totalClaimed: string;
    count: number;
    recent: Array<{
      id: string;
      amountClaimed: string;
      txHash: string | null;
      claimedAt: string;
    }>;
  };
  streak: { currentStreak: number; longestStreak: number; totalLogins: number } | null;
  referrals: { directCount: number; downlineCount: number; points: number };
  /** Completion counts keyed by status (pending/verified/rejected). */
  completions: Record<string, number>;
  latestActivity: AdminActivityItem[];
}

export interface AdminReferralTop {
  userId: string;
  username: string | null;
  firstName: string | null;
  directCount: number;
  downlineCount: number;
  points: number;
}

export interface AdminReferralEdge {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  status: ReferralStatus;
  rewardPoints: number | null;
  createdAt: string;
  referrerUsername: string | null;
  referredUsername: string | null;
}

/** Shared-IP heuristic flag: a review signal, NOT proof of fraud. */
export interface AdminReferralFlagged {
  referrerId: string;
  referredId: string;
  referrerUsername: string | null;
  referredUsername: string | null;
  sharedIps: string[];
}

export interface AdminReferralsResponse {
  topReferrers: AdminReferralTop[];
  edges: Page<AdminReferralEdge>;
  flagged: AdminReferralFlagged[];
}

/** Ops/system health snapshot (admin+). Nulls mean "could not read". */
export interface AdminSystemHealth {
  indexer: {
    indexedBlockNumber: string | null;
    headBlockNumber: string | null;
    lagBlocks: number | null;
    latestEventAt: string | null;
  };
  rateSyncKeeper: { action: string; createdAt: string; newValue: unknown } | null;
  merkleRoots: {
    counts: {
      broadcasting: number;
      pending_confirmation: number;
      pending_safe: number;
      committed: number;
      failed: number;
    };
    inFlightPastGrace: number;
  };
  verificationJobs: {
    queued: number;
    running: number;
    retry: number;
    failed: number;
    oldestQueuedAgeMinutes: number | null;
  };
  saleConfig: {
    rate: string;
    priceUsd: string | null;
    minPurchase: string;
    capPerWallet: string;
    isPaused: boolean;
    updatedAt: string;
  } | null;
}

export interface SaleConfigUpdate {
  rate?: string;
  capPerWallet?: string;
  minPurchase?: string;
  bnbHardCap?: string;
  saleStart?: string | null;
  saleEnd?: string | null;
  isPaused?: boolean;
  /** App-level visibility gate: 'draft' hides the sale from the public
   *  (landing Coming Soon, admin-only buying) until flipped to 'public'.
   *  DB-only — never produces a contract call or Safe proposal. */
  saleMode?: 'draft' | 'public';
  /** USD price per $OKN (human). Takes precedence over `rate` — the server
   *  derives the on-chain rate from it at the live Chainlink BNB/USD price. */
  priceUsd?: number;
  /** USD minimum purchase (human, $10 = 10). Takes precedence over
   *  `minPurchase` — the server derives the on-chain BNB minimum from it at
   *  the live Chainlink BNB/USD price. */
  minPurchaseUsd?: number;
}

/** One mainnet sale-config change waiting to be queued in the Safe. */
export interface PreparedSafeCall {
  /** TokenSale mutator name (setRate, setCapPerWallet, ...). */
  fn: string;
  /** Human summary of the change (also written to the audit log). */
  label: string;
  /** POST /api/admin/safe/propose body that queues this call, or null when
   *  the call has no propose action (must be signed manually). */
  propose: Record<string, string | number> | null;
}

/** POST /api/admin/sale-config result. Testnet: applied immediately.
 *  Mainnet: every planned call returned for Safe queueing (nothing applied). */
export interface SaleConfigResult {
  ok?: boolean;
  mode: string;
  message?: string;
  txHashes?: string[];
  calls?: PreparedSafeCall[];
  safeAppUrl?: string;
}

export interface CommitRootResult {
  pendingUsers: number;
  rootVersion: number | null;
  txHash: string | null;
  /** Lifecycle status of the root row. CRIT #4: 'committed' only after on-chain confirmation. */
  status: 'committed' | 'pending_confirmation' | 'pending_safe' | 'failed';
  /** Present when status is pending_*, explains next step. */
  message?: string;
  committedBy: string;
}

// === 6.10 — BNB withdrawal ===
export interface BnbWithdrawBalance {
  tokenSale: { address: string | null; bnbBalance: string | null };
  distributor: {
    address: string | null;
    bnbBalance: string | null;
    treasury: string | null;
  };
  treasuryHint: string;
}

export interface BnbWithdrawInput {
  reason: 'token_sale' | 'distributor_fees';
  destination?: string;
  amount?: string; // wei
}

export interface BnbWithdrawResult {
  ok?: boolean;
  mode: string;
  txHash?: string;
  description?: string;
  message?: string;
  target?: string;
  calldata?: string;
  value?: string;
}

// === 6.11 — Wallet rebind ===
export interface WalletRebindRequest {
  id: string;
  userId: string;
  oldWallet: string;
  newWallet: string;
  reason: 'lost_key' | 'compromised' | 'upgrade' | 'admin_fix' | null;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  proofData: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt: string | null;
  // joined fields
  username: string | null;
  firstName: string | null;
  currentWallet: string | null;
  approverUsername: string | null;
  approverFirstName: string | null;
}

export interface RebindRequestInput {
  newWallet: `0x${string}`;
  signature: `0x${string}`;
  message: string;
  reason: 'lost_key' | 'compromised' | 'upgrade' | 'admin_fix';
}

/** Input for POST /api/wallet/unbind (self-service wallet disconnect).
 *  Body is { message, signature } only — the server derives the address from
 *  the DB and verifies the signature against the bound wallet. */
export interface UnbindRequestInput {
  message: string;
  signature: `0x${string}`;
}

// === Client ===

/**
 * GET /api/sale/price response: the sale_config row (SaleConfig) plus optional
 * public BNB/USD sibling fields for the buy widget's approx-USD display. The
 * fields are omitted when the Chainlink feed is unavailable; the route still
 * returns a bare null body when the sale is not configured.
 */
export interface SalePriceResponse extends SaleConfig {
  /** Live BNB/USD in Chainlink 8-dec scale, as a string (bigint does not JSON-serialize). */
  bnbUsd8?: string;
  /** Feed updatedAt, unix seconds. */
  bnbUsdUpdatedAt?: number;
  /** Older than the 300s Chainlink grace. */
  bnbUsdStale?: boolean;
  /** True when the payload was NEUTRALIZED by draft-mode masking (the viewer
   *  is not an admin): numbers are zeroed, the window cleared. Consumers use
   *  this to distinguish the soft-launch Coming Soon state from "unconfigured". */
  masked?: boolean;
}

/** Build a page+pageSize+search query-string fragment for paginated admin
 *  endpoints. `needsLeadingAmp` should be true when the URL already has a `?`
 *  (e.g. a status filter precedes it) so we prepend '&' instead of '?'. */
function pageParams(
  opts: { page?: number; pageSize?: number; q?: string } | undefined,
  needsLeadingAmp = false,
): string {
  if (!opts?.page && !opts?.pageSize && !opts?.q) return '';
  const parts: string[] = [];
  if (opts.page) parts.push(`page=${opts.page}`);
  if (opts.pageSize) parts.push(`pageSize=${opts.pageSize}`);
  if (opts.q) parts.push(`q=${encodeURIComponent(opts.q)}`);
  const qs = parts.join('&');
  return needsLeadingAmp ? `&${qs}` : `?${qs}`;
}

export const api = {
  // Auth & Binding
  loginWithWallet: (input: { address: string; message: string; signature: string }) =>
    request<{ ok: true; user: MeUser }>('/api/auth/wallet', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  bindTelegram: (input: { authData: Record<string, string | number> }) =>
    request<{ ok: true; telegramId: string; rewardAwarded: boolean; points: number }>('/api/telegram/bind', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getTelegramBindToken: () =>
    request<{ ok: true; token: string; botUsername: string; deepLink: string; expiresAt: string }>(
      '/api/telegram/bind-token',
    ),
  // Session user
  getMe: () => request<{ user: MeUser | null }>('/api/me'),
  updateProfile: (input: UpdateProfileInput) =>
    request<{ user: MeUser }>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  // Email verification: send a 6-digit code (dev returns devCode), then verify.
  sendEmailVerification: () =>
    request<{ ok: true; devCode?: string }>('/api/profile/verify-email/send', {
      method: 'POST',
      body: '{}',
    }),
  verifyEmail: (code: string) =>
    request<{ user: MeUser }>('/api/profile/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  // Two-factor auth: setup (returns secret + QR), enable (verifies code, returns
  // backup codes once), disable (verifies code, removes).
  setup2fa: () =>
    request<{ secret: string; otpauth: string; qrDataUrl: string }>('/api/profile/2fa/setup', {
      method: 'POST',
      body: '{}',
    }),
  enable2fa: (code: string) =>
    request<{ ok: true; backupCodes: string[] }>('/api/profile/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  disable2fa: (code: string) =>
    request<{ ok: true }>('/api/profile/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  getReferralInfo: () => request<ReferralInfo>('/api/referral'),

  // Tasks
  getTasks: () => request<TaskWithStatus[]>('/api/tasks'),
  completeTask: (taskId: string, proofData?: Record<string, unknown>) =>
    request<TaskCompletion>(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ taskId, proofData }),
    }),

  // Claims
  getClaimEligibility: () =>
    request<{ points: number; latestRootVersion: number | null }>(`/api/claims`),
  getClaimProof: (rootVersion: number) =>
    request<ClaimProofResponse>(`/api/claims/proof?rootVersion=${rootVersion}`),

  // Sale
  getSalePrice: () => request<SalePriceResponse | null>('/api/sale/price'),
  getPurchaseHistory: () => request<Purchase[]>('/api/sale/history'),

  // Rewards (Phase 2 — daily login)
  getStreak: () => request<StreakInfo>('/api/rewards/streak'),
  checkIn: () => request<CheckInResult>('/api/rewards/check-in', { method: 'POST' }),

  // Portfolio (Phase 3 — aggregation)
  getPortfolio: () => request<Portfolio>('/api/portfolio'),

  // Leaderboard (Phase 4 — live rankings + past winners)
  getLeaderboard: (
    params: { category: LeaderboardCategory; period: LeaderboardPeriod; limit?: number },
  ) =>
    request<LeaderboardResponse>(
      `/api/leaderboard?category=${params.category}&period=${params.period}&limit=${params.limit ?? 50}`,
    ),
  getLeaderboardWinners: (
    params: { period?: LeaderboardPeriod; category?: LeaderboardCategory; limit?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.period) qs.set('period', params.period);
    if (params.category) qs.set('category', params.category);
    qs.set('limit', String(params.limit ?? 50));
    return request<{ winners: LeaderboardWinner[] }>(`/api/leaderboard/winners?${qs.toString()}`);
  },

  // Missions (Phase 5 — community goals)
  getMissions: () => request<{ missions: MissionWithProgress[] }>('/api/missions'),
  getAdminMissions: () =>
    request<{ missions: AdminMission[]; eligibleUsers: number }>('/api/admin/missions'),
  createMission: (input: CreateMissionInput) =>
    request<Mission>('/api/admin/missions', { method: 'POST', body: JSON.stringify(input) }),
  updateMission: (
    id: string,
    input: Partial<{ threshold: string; rewardPerUser: number; title: string; description: string }>,
  ) =>
    request<Mission>(`/api/admin/missions/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteMission: (id: string) =>
    request<{ ok: true }>(`/api/admin/missions/${id}`, { method: 'DELETE' }),
  triggerMission: (id: string) =>
    request<{ id: string; status: string; achieved: boolean; distributedTo: number }>(
      `/api/admin/missions/${id}`,
      { method: 'POST' },
    ),

  // Auth
  telegramLogin: (authData: string) =>
    request<{ ok: true }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ authData }),
    }),
  telegramInitData: (initData: string) =>
    request<{ ok: true }>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),

  // Admin
  getAdminStats: () => request<AdminStats>('/api/admin/stats'),
  getAdminUsers: (opts?: { page?: number; pageSize?: number; q?: string }) =>
    request<Page<AdminUser>>(`/api/admin/users${pageParams(opts)}`),
  getAdminClaims: (opts?: { page?: number; pageSize?: number }) =>
    request<AdminClaimsResponse>(`/api/admin/claims${pageParams(opts)}`),
  // G8: leaderboard admin surface — list past winners + manually trigger a snapshot.
  getAdminLeaderboardWinners: (params: { period?: LeaderboardPeriod; category?: LeaderboardCategory; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.period) qs.set('period', params.period);
    if (params.category) qs.set('category', params.category);
    qs.set('limit', String(params.limit ?? 200));
    return request<LeaderboardWinner[]>(`/api/admin/leaderboard?${qs.toString()}`);
  },
  triggerLeaderboardSnapshot: (period: 'weekly' | 'monthly') =>
    request<{ ok: true; period: string; periodKey: string } & Record<string, { ranked: number; paid: number }>>(
      '/api/admin/leaderboard',
      { method: 'POST', body: JSON.stringify({ period }) },
    ),
  getAdminCompletions: (
    status: TaskCompletionStatus | 'all' = 'pending',
    opts?: { page?: number; pageSize?: number; q?: string },
  ) => request<Page<AdminCompletion>>(`/api/admin/completions?status=${status}${pageParams(opts, true)}`),
  moderateCompletion: (id: string, action: 'verify' | 'reject', reason?: string) =>
    request<TaskCompletion>(`/api/admin/completions/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
    }),
  getPendingCompletionsCount: () =>
    request<{ pending: number }>('/api/admin/completions/count'),
  getAdminTasks: (opts?: { page?: number; pageSize?: number; q?: string }) =>
    request<Page<AdminTask>>(`/api/admin/tasks${pageParams(opts)}`),
  createTask: (input: CreateTaskInput) =>
    request<Task>('/api/admin/tasks', { method: 'POST', body: JSON.stringify(input) }),
  toggleTask: (id: string, isActive: boolean) =>
    request<Task>(`/api/admin/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  updateTask: (id: string, input: UpdateTaskInput) =>
    request<Task>(`/api/admin/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTask: (id: string) =>
    request<{ ok: true }>(`/api/admin/tasks/${id}`, { method: 'DELETE' }),
  getAuditLogs: (opts?: { page?: number; pageSize?: number; q?: string }) =>
    request<Page<AuditLogEntry>>(`/api/admin/audit-logs${pageParams(opts)}`),
  getMerkleRoots: (opts?: {
    page?: number;
    pageSize?: number;
    status?: MerkleRootStatus;
  }) => {
    // Mirror the completions pattern: status filter first (?status=), then
    // page params appended with pageParams(opts, true) (leading '&' when present).
    const statusPart = opts?.status ? `?status=${opts.status}` : '';
    return request<Page<MerkleRootHistoryItem>>(
      `/api/admin/merkle-roots${statusPart}${pageParams(opts, Boolean(statusPart))}`,
    );
  },
  updateSaleConfig: (input: SaleConfigUpdate) =>
    request<SaleConfigResult>('/api/admin/sale-config', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  // Reward config (Phase 2 — daily login / referral levels)
  getRewardConfig: () => request<RewardConfig>('/api/admin/reward-config'),
  updateRewardConfig: (input: Partial<RewardConfig>) =>
    request<RewardConfig>('/api/admin/reward-config', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  commitRoot: () =>
    request<CommitRootResult>('/api/admin/commit-root', { method: 'POST', body: '{}' }),
  setUserRole: (userId: string, role: AdminRoleName) =>
    request<{ ok: true; userId: string; oldRole: string | null; newRole: string }>(
      '/api/admin/role',
      { method: 'POST', body: JSON.stringify({ userId, role }) },
    ),

  // Create / remove admins (super_admin only)
  createAdmin: (input: {
    telegramId: string;
    username?: string;
    firstName?: string;
    role: AdminRoleName;
  }) =>
    request<{
      ok: boolean;
      mode: 'created' | 'promoted' | 'noop';
      userId: string;
      telegramId?: string;
      role?: AdminRoleName;
      oldRole?: AdminRoleName | null;
      newRole?: AdminRoleName;
      message?: string;
    }>('/api/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  removeAdmin: (userId: string) =>
    request<{
      ok: boolean;
      mode: 'removed' | 'noop';
      userId: string;
      removedRole?: AdminRoleName | null;
      message?: string;
    }>('/api/admin/remove-admin', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  // G7: user moderation (ban/suspend/restore). Invalidates the target's sessions.
  moderateUser: (userId: string, status: 'active' | 'suspended' | 'banned', reason?: string) =>
    request<{ ok: true }>(`/api/admin/users/${userId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),

  // 6.10 — BNB withdrawal
  getBnbWithdrawBalance: () => request<BnbWithdrawBalance>('/api/admin/bnb-withdraw'),
  withdrawBnb: (input: BnbWithdrawInput) =>
    request<BnbWithdrawResult>('/api/admin/bnb-withdraw', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // 6.13 — Claim fee control (MerkleDistributor.setClaimFeeUsd)
  getClaimFee: () =>
    request<{
      feeUsd: string | null;
      feeUsdDisplay: number | null;
      requiredBnb: string | null;
    }>('/api/admin/claim-fee'),
  updateClaimFee: (input: { feeUsd: number }) =>
    request<{ ok?: boolean; mode: string; message?: string; txHash?: string }>(
      '/api/admin/claim-fee',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    ),

  // Live Chainlink BNB/USD for the sale-pricing calculator (admin).
  getBnbPrice: () =>
    request<{
      /** 8-dec USD as a string (bigint does not JSON-serialize). */
      price8: string;
      /** Human display value. */
      priceUsd: number;
      /** Feed updatedAt, unix seconds. */
      updatedAt: number;
      /** Older than the 300s Chainlink grace. */
      stale: boolean;
    }>('/api/admin/bnb-price'),

  // Manual run of the USD sale-price keeper (admin + 2FA).
  triggerRateSync: () =>
    request<{
      ok: boolean;
      action: 'noop' | 'broadcast' | 'propose';
      reason?: string;
      driftBps: number | null;
      txHash: string | null;
      safeTxHash: string | null;
    }>('/api/admin/rate-sync', { method: 'POST' }),

  // 6.11 — Wallet rebind (admin)
  getRebindRequests: (
    status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
    opts?: { page?: number; pageSize?: number; q?: string },
  ) => {
    const statusPart = status !== 'all' ? `?status=${status}` : '';
    return request<Page<WalletRebindRequest>>(
      `/api/admin/rebind${statusPart}${pageParams(opts, Boolean(statusPart))}`,
    );
  },
  decideRebind: (id: string, action: 'approve' | 'reject') =>
    request<{
      ok: boolean;
      status: string;
      userId?: string;
      newWallet?: string;
      note?: string;
    }>(`/api/admin/rebind/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // 6.11 — Wallet rebind (user-side request)
  submitRebindRequest: (input: RebindRequestInput) =>
    request<{ ok: true; id: string; status: string; message: string }>('/api/wallet/rebind', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // 6.12 — Wallet unbind (self-service disconnect). Requires an EIP-191
  // signature from the currently bound wallet proving the user still controls
  // it. The hook (useUnbindWallet) builds the message + signs it.
  unbindWallet: (input: UnbindRequestInput) =>
    request<{ ok: true }>('/api/wallet/unbind', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  // === Safe multisig proposal lifecycle ===
  safeGetPending: () => request<{ proposals: unknown[]; safeInfo: unknown }>('/api/admin/safe/pending'),
  safeGetHistory: (opts?: { page?: number; pageSize?: number }) =>
    request<{ proposals: unknown[]; total: number; page: number; pageSize: number }>(
      `/api/admin/safe/history${pageParams(opts)}`,
    ),
  safePropose: (input: Record<string, unknown>) =>
    request<{ ok: boolean; safeTxHash: string; action: string }>('/api/admin/safe/propose', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  safeSign: (input: { safeTxHash: string; signature: string }) =>
    request<{ ok: boolean }>('/api/admin/safe/sign', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  safeReject: (input: { proposalId: string; reason: string }) =>
    request<{ ok: boolean }>('/api/admin/safe/reject', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  safeExecute: (input: { proposalId: string }) =>
    request<{ ok: boolean; txHash: string | null }>('/api/admin/safe/execute', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  // === Admin monitoring surfaces ===
  // Global user activity feed. ipAddress/userAgent appear in the payload only
  // for admin-level requesters (the server strips them for support/moderator).
  getAdminActivity: (opts?: { page?: number; pageSize?: number; q?: string; action?: string }) => {
    const actionPart = opts?.action ? `?action=${encodeURIComponent(opts.action)}` : '';
    return request<Page<AdminActivityItem>>(
      `/api/admin/activity${actionPart}${pageParams(opts, Boolean(actionPart))}`,
    );
  },
  // Per-user activity feed (user DetailDialog section + pagination).
  getAdminUserActivity: (userId: string, opts?: { page?: number; pageSize?: number }) =>
    request<Page<AdminActivityItem>>(
      `/api/admin/users/${userId}/activity${pageParams(opts)}`,
    ),
  // Email delivery log (support workflows; ?userId= scopes to one user).
  getAdminEmailLog: (opts?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
    userId?: string;
  }) => {
    const pre = new URLSearchParams();
    if (opts?.status) pre.set('status', opts.status);
    if (opts?.userId) pre.set('userId', opts.userId);
    const preStr = pre.toString();
    return request<Page<AdminEmailLogItem>>(
      `/api/admin/email-log${preStr ? `?${preStr}` : ''}${pageParams(opts, Boolean(preStr))}`,
    );
  },
  // Full purchase list + top-buyer summary.
  getAdminPurchases: (opts?: { page?: number; pageSize?: number; q?: string }) =>
    request<AdminPurchasesResponse>(`/api/admin/purchases${pageParams(opts)}`),
  // Per-user 360 overview (lazy-loaded when the user DetailDialog opens).
  getAdminUserOverview: (userId: string) =>
    request<AdminUserOverview>(`/api/admin/users/${userId}/overview`),
  // Referral monitoring: top referrers, recent edges, shared-IP heuristic flags.
  getAdminReferrals: (opts?: { page?: number; pageSize?: number }) =>
    request<AdminReferralsResponse>(`/api/admin/referrals${pageParams(opts)}`),
  // Ops/system health snapshot (admin+).
  getAdminSystem: () => request<AdminSystemHealth>('/api/admin/system'),

  // === Notifications ===
  getNotifications: () => request<{ notifications: unknown[] }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};
