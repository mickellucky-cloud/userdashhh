/**
 * lib/hooks/use-tasks.ts — Phase 5
 * TanStack Query hooks for the task system.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: api.getTasks });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, proofData }: { taskId: string; proofData?: Record<string, unknown> }) =>
      api.completeTask(taskId, proofData),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
