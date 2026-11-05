/**
 * lib/hooks/use-safe-proposals.ts
 *
 * TanStack Query hooks for the Safe proposal lifecycle:
 *   - useSafePending: polls /api/admin/safe/pending every 15s
 *   - useSafeHistory: fetches completed/rejected proposals
 *   - useProposeSafeTx: creates a new proposal
 *   - useSignSafeTx: submits an off-chain signature
 *   - useRejectSafeTx: rejects a proposal (super_admin only)
 *   - useExecuteSafeTx: broadcasts the assembled multi-sig
 *
 * The pending hook groups proposals into 3 categories for the UI:
 *   - "needs_signature": admin hasn't signed yet
 *   - "waiting_others": admin signed, waiting for co-signers
 *   - "ready_execute": threshold met, ready to broadcast
 */
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import { api } from '@/lib/api/client';

export interface SafeProposal {
  id: string;
  safeTxHash: string | null;
  action: string;
  target: string | null;
  functionName: string | null;
  args: Record<string, unknown> | null;
  calldata: string;
  nonce: string | null;
  status: string;
  signers: Array<{ address: string; signedAt: string }> | null;
  proposerId: string;
  confirmations: number;
  threshold: number;
  readyToExecute: boolean;
  createdAt: string;
  // History-only fields:
  txHash?: string | null;
  rejectReason?: string | null;
  rejectedBy?: string | null;
  executedAt?: string | null;
}

interface SafeInfo {
  threshold: number;
  owners: string[];
  nonce: string;
}

export function useSafePending() {
  return useQuery<{ proposals: SafeProposal[]; safeInfo: SafeInfo }>({
    queryKey: ['admin', 'safe', 'pending'],
    queryFn: () => api.safeGetPending() as Promise<{ proposals: SafeProposal[]; safeInfo: SafeInfo }>,
    refetchInterval: 15_000, // poll every 15s for new proposals/signatures
    staleTime: 10_000,
  });
}

export function useSafeHistory(opts?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['admin', 'safe', 'history', opts?.page ?? 1, opts?.pageSize ?? 50],
    queryFn: () =>
      api.safeGetHistory({ page: opts?.page, pageSize: opts?.pageSize }) as Promise<{
        proposals: SafeProposal[];
        total: number;
        page: number;
        pageSize: number;
      }>,
    staleTime: 30_000,
  });
}

export function useProposeSafeTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.safePropose(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'pending'] });
    },
  });
}

export function useSignSafeTx() {
  const qc = useQueryClient();
  const { signMessageAsync } = useSignMessage();

  return useMutation({
    mutationFn: async (params: { safeTxHash: string }) => {
      // Sign the safeTxHash off-chain (MetaMask pops up, zero gas)
      const signature = await signMessageAsync({
        message: params.safeTxHash,
      });
      // Submit the signature to the server → Safe Transaction Service
      return api.safeSign({ safeTxHash: params.safeTxHash, signature });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'pending'] });
    },
  });
}

export function useRejectSafeTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { proposalId: string; reason: string }) => api.safeReject(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'pending'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'history'] });
    },
  });
}

export function useExecuteSafeTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { proposalId: string }) => api.safeExecute(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'pending'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'safe', 'history'] });
    },
  });
}
