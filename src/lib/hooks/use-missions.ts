/**
 * lib/hooks/use-missions.ts — Phase 5 community mission queries + admin mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CreateMissionInput } from '@okn/shared';

const MISSIONS_KEY = ['missions'] as const;
const ADMIN_MISSIONS_KEY = ['admin', 'missions'] as const;

/** User-facing mission list with live progress + the viewer's eligibility. */
export function useMissions() {
  return useQuery({ queryKey: MISSIONS_KEY, queryFn: api.getMissions });
}

/** Admin list with metric values + payout projections. */
export function useAdminMissions() {
  return useQuery({ queryKey: ADMIN_MISSIONS_KEY, queryFn: api.getAdminMissions });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMissionInput) => api.createMission(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_MISSIONS_KEY }),
  });
}

export function useUpdateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateMission>[1] }) =>
      api.updateMission(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_MISSIONS_KEY }),
  });
}

export function useDeleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_MISSIONS_KEY }),
  });
}

export function useTriggerMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.triggerMission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_MISSIONS_KEY });
      qc.invalidateQueries({ queryKey: MISSIONS_KEY });
    },
  });
}
