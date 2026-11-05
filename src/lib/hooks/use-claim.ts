/**
 * lib/hooks/use-claim.ts — Phase 5.10
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useClaimEligibility() {
  return useQuery({ queryKey: ['claim-eligibility'], queryFn: api.getClaimEligibility });
}

export function useClaimProof(rootVersion: number | null) {
  return useQuery({
    queryKey: ['claim-proof', rootVersion],
    queryFn: () => {
      if (rootVersion == null) throw new Error('No root version');
      return api.getClaimProof(rootVersion);
    },
    enabled: rootVersion != null,
  });
}
