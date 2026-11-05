/**
 * lib/hooks/use-rewards.ts — Phase 2 daily login rewards.
 *
 * useStreak: read the user's streak + next-reward preview.
 * useCheckIn: fire the daily check-in; on success invalidates the streak and
 *   claim-eligibility queries so the UI reflects the new points immediately.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const STREAK_KEY = ['rewards', 'streak'] as const;

export function useStreak() {
  return useQuery({ queryKey: STREAK_KEY, queryFn: api.getStreak });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.checkIn,
    onSuccess: () => {
      // Streak changed, and claimable points (bonus ledger) may have grown.
      qc.invalidateQueries({ queryKey: STREAK_KEY });
      qc.invalidateQueries({ queryKey: ['claim-eligibility'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
