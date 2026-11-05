/**
 * lib/hooks/use-leaderboard.ts — Phase 4 leaderboard queries.
 *
 * useLeaderboard: live ranking for a (category, period) including the viewer's
 *   own rank. queryKey embeds both so switching tabs refetches.
 * useLeaderboardWinners: past snapshot winners, optionally filtered.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { LeaderboardCategory, LeaderboardPeriod } from '@okn/shared';

export function useLeaderboard(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  limit = 50,
) {
  return useQuery({
    queryKey: ['leaderboard', category, period, limit],
    queryFn: () => api.getLeaderboard({ category, period, limit }),
  });
}

export function useLeaderboardWinners(
  params: { period?: LeaderboardPeriod; category?: LeaderboardCategory; limit?: number } = {},
) {
  return useQuery({
    queryKey: ['leaderboard', 'winners', params.period ?? 'all', params.category ?? 'all', params.limit ?? 50],
    queryFn: () => api.getLeaderboardWinners(params),
  });
}
