/**
 * lib/hooks/use-admin.ts — TanStack Query hooks for the admin area.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TaskCompletionStatus, LeaderboardPeriod, LeaderboardCategory } from '@okn/shared';
import { api, type AdminRoleName, type CreateTaskInput, type SaleConfigUpdate, type UpdateTaskInput } from '../api/client';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: api.getAdminStats });
}

/** Page-based list hooks. `page`, `pageSize`, and `q` are part of the
 *  queryKey, so paging, resizing, or searching refetches exactly that page.
 *  Callers reset their page state when the search term or filter changes. */
export function useAdminUsers(opts?: { page?: number; pageSize?: number; q?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () => api.getAdminUsers({ page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

export function useAdminClaims(opts?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['admin', 'claims', opts?.page ?? 1, opts?.pageSize ?? 50],
    queryFn: () => api.getAdminClaims({ page: opts?.page, pageSize: opts?.pageSize }),
  });
}

export function useAdminCompletions(
  status: TaskCompletionStatus | 'all' = 'pending',
  opts?: { page?: number; pageSize?: number; q?: string },
) {
  return useQuery({
    queryKey: ['admin', 'completions', status, opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () =>
      api.getAdminCompletions(status, { page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

export function useModerateCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'verify' | 'reject';
      reason?: string;
    }) => api.moderateCompletion(id, action, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'completions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'completions-count'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'claims'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

/**
 * Live pending-verification count for the sidebar moderation badge and the
 * dashboard quick-action card. 30s poll matches the notification bell cadence;
 * failures degrade to undefined (badge hidden, never an error state).
 */
export function usePendingCompletionsCount() {
  return useQuery<{ pending: number }>({
    queryKey: ['admin', 'completions-count'],
    queryFn: () => api.getPendingCompletionsCount(),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });
}

export function useAdminTasks(opts?: { page?: number; pageSize?: number; q?: string }) {
  return useQuery({
    queryKey: ['admin', 'tasks', opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () => api.getAdminTasks({ page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.createTask(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'tasks'] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.toggleTask(id, isActive),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'tasks'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.updateTask(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      // User-side task list mirrors these rows; keep it in sync so the title /
      // reward an admin just edited shows up for users without a manual refetch.
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      void qc.invalidateQueries({ queryKey: ['tasks'] });
      // Completion counts feed the admin overview stats.
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useAuditLogs(opts?: { page?: number; pageSize?: number; q?: string }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () => api.getAuditLogs({ page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

/**
 * Merkle commit history (GET /api/admin/merkle-roots). Newest commit first.
 * Invalidated by useCommitRoot so the history refreshes after every commit.
 */
export function useMerkleRoots(opts?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['admin', 'merkle-roots', opts?.page ?? 1, opts?.pageSize ?? 50],
    queryFn: () => api.getMerkleRoots({ page: opts?.page, pageSize: opts?.pageSize }),
  });
}

export function useUpdateSaleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaleConfigUpdate) => api.updateSaleConfig(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sale-price'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useCommitRoot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.commitRoot(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'claims'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'merkle-roots'] });
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminRoleName }) =>
      api.setUserRole(userId, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// === Create / remove admins (super_admin only) ===
export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      telegramId: string;
      username?: string;
      firstName?: string;
      role: AdminRoleName;
    }) => api.createAdmin(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useRemoveAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.removeAdmin(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

// === G7 — user moderation (ban/suspend/restore) ===
export function useModerateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: string; status: 'active' | 'suspended' | 'banned'; reason?: string }) =>
      api.moderateUser(args.userId, args.status, args.reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

// === 6.10 — BNB withdrawal ===
export function useBnbWithdrawBalance() {
  return useQuery({
    queryKey: ['admin', 'bnb-withdraw'],
    queryFn: api.getBnbWithdrawBalance,
    // Balances are chain-state; refetch every 30s while the panel is open.
    refetchInterval: 30_000,
  });
}

export function useWithdrawBnb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: 'token_sale' | 'distributor_fees'; destination?: string; amount?: string }) =>
      api.withdrawBnb(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'bnb-withdraw'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

// === 6.13 — Claim fee control (MerkleDistributor.setClaimFeeUsd) ===
export function useClaimFee() {
  return useQuery({
    queryKey: ['admin', 'claim-fee'],
    queryFn: api.getClaimFee,
    // Fee + BNB equivalent are chain-state; refetch every 30s.
    refetchInterval: 30_000,
  });
}

export function useUpdateClaimFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { feeUsd: number }) => api.updateClaimFee(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'claim-fee'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// === Live Chainlink BNB/USD (sale-pricing calculator) ===
export function useBnbPrice() {
  return useQuery({
    queryKey: ['admin', 'bnb-price'],
    queryFn: api.getBnbPrice,
    // Chainlink feed state; refetch every 30s (mirrors useClaimFee).
    refetchInterval: 30_000,
  });
}

// === Manual USD rate-sync (keeper trigger) ===
export function useRateSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.triggerRateSync,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sale-price'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// === 6.11 — Wallet rebind (admin) ===
export function useRebindRequests(
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
  opts?: { page?: number; pageSize?: number; q?: string },
) {
  return useQuery({
    queryKey: ['admin', 'rebind', status, opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () => api.getRebindRequests(status, { page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

export function useDecideRebind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api.decideRebind(id, action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rebind'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

// === G8 — leaderboard admin surface ===
export function useAdminLeaderboardWinners(params: {
  period?: LeaderboardPeriod;
  category?: LeaderboardCategory;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'leaderboard-winners', params.period ?? 'all', params.category ?? 'all', params.limit ?? 100],
    queryFn: () =>
      api.getAdminLeaderboardWinners({ period: params.period, category: params.category, limit: params.limit }),
  });
}

export function useTriggerLeaderboardSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period: 'weekly' | 'monthly') => api.triggerLeaderboardSnapshot(period),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'leaderboard-winners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      // Bonus payouts hit claim_ledger, which feeds claims/points.
      void qc.invalidateQueries({ queryKey: ['admin', 'claims'] });
    },
  });
}

// === Admin monitoring surfaces ===

/** Global user activity feed (?action=/?q= filters are part of the key). */
export function useAdminActivity(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  action?: string;
}) {
  return useQuery({
    queryKey: [
      'admin',
      'activity',
      opts?.page ?? 1,
      opts?.pageSize ?? 50,
      opts?.q ?? '',
      opts?.action ?? '',
    ],
    queryFn: () =>
      api.getAdminActivity({ page: opts?.page, pageSize: opts?.pageSize, q: opts?.q, action: opts?.action }),
  });
}

/** Per-user activity feed. Disabled until a userId is provided. */
export function useAdminUserActivity(
  userId: string | null,
  opts?: { page?: number; pageSize?: number },
) {
  return useQuery({
    queryKey: ['admin', 'user-activity', userId, opts?.page ?? 1, opts?.pageSize ?? 50],
    queryFn: () => api.getAdminUserActivity(userId!, { page: opts?.page, pageSize: opts?.pageSize }),
    enabled: !!userId,
  });
}

/** Email delivery log. Pass userId to scope to one user (DetailDialog). */
export function useAdminEmailLog(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  userId?: string;
}) {
  return useQuery({
    queryKey: [
      'admin',
      'email-log',
      opts?.page ?? 1,
      opts?.pageSize ?? 50,
      opts?.q ?? '',
      opts?.status ?? '',
      opts?.userId ?? '',
    ],
    queryFn: () =>
      api.getAdminEmailLog({
        page: opts?.page,
        pageSize: opts?.pageSize,
        q: opts?.q,
        status: opts?.status,
        userId: opts?.userId,
      }),
  });
}

/** Purchase list + top-buyer summary. */
export function useAdminPurchases(opts?: { page?: number; pageSize?: number; q?: string }) {
  return useQuery({
    queryKey: ['admin', 'purchases', opts?.page ?? 1, opts?.pageSize ?? 50, opts?.q ?? ''],
    queryFn: () => api.getAdminPurchases({ page: opts?.page, pageSize: opts?.pageSize, q: opts?.q }),
  });
}

/**
 * Per-user 360 overview. Lazy: `enabled` keeps it idle until the user
 * DetailDialog actually opens with a userId.
 */
export function useAdminUserOverview(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user-overview', userId],
    queryFn: () => api.getAdminUserOverview(userId!),
    enabled: !!userId,
  });
}

/** Referral monitoring (top referrers, recent edges, shared-IP flags). */
export function useAdminReferrals(opts?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['admin', 'referrals', opts?.page ?? 1, opts?.pageSize ?? 50],
    queryFn: () => api.getAdminReferrals({ page: opts?.page, pageSize: opts?.pageSize }),
  });
}

/**
 * Ops/system health. 30s poll matches the other live admin surfaces; the
 * payload is read-only and degrades to nulls server-side.
 */
export function useAdminSystem() {
  return useQuery({
    queryKey: ['admin', 'system'],
    queryFn: api.getAdminSystem,
    refetchInterval: 30_000,
  });
}
