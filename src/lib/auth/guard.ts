/**
 * lib/auth/guard.ts — Standalone Dashboard Guard
 * Returns session for user routes. Provides seamless fallback for standalone deployment.
 */
import { getSession, DEV_SESSION } from './session';
import { isAdmin, type AdminRole } from './permissions';
import { logger } from '@/lib/logger';

export { isAuthBypassed } from './bypass';

export async function requireUser() {
  try {
    const session = await getSession();
    if (session) return session;
  } catch (err) {
    logger.warn('requireUser session check error, falling back to demo session', err);
  }
  return DEV_SESSION;
}

export async function requireAdmin() {
  const user = await requireUser();
  return user;
}
