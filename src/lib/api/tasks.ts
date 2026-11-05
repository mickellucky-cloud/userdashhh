/**
 * lib/api/tasks.ts — Phase 5
 * Task-domain API helpers. Re-exports from the central client.
 */
import { api } from './client';

export const getTasks = api.getTasks;
export const completeTask = api.completeTask;
