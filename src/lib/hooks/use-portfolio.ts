/**
 * lib/hooks/use-portfolio.ts — Phase 3 portfolio aggregation for the current user.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function usePortfolio() {
  return useQuery({ queryKey: ['portfolio'], queryFn: api.getPortfolio });
}
