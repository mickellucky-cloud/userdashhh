/**
 * lib/hooks/use-referral.ts — referral link + stats for the current user.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useReferral() {
  return useQuery({ queryKey: ['referral'], queryFn: api.getReferralInfo });
}
