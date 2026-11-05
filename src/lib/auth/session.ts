/**
 * lib/auth/session.ts — Phase 4.5
 * JWT cookie management. httpOnly + secure + sameSite=strict (plan §3.2).
 * Reads/writes via server-side helpers only.
 *
 * SEC HIGH #1: the JWT secret MUST be provided in production. Previously the
 * module fell back to a hardcoded 'dev-insecure-secret-change-me' string,
 * making every production JWT forgeable by anyone who read the repo.
 *
 * Laziness — important:
 *   The secret MUST be resolved on first real use (sign/verify), NOT at
 *   module load. `next build` imports every route module during the
 *   "Collecting page data" phase; if `resolveSecret()` runs at top level, a
 *   too-short or missing JWT_SECRET would crash the BUILD itself. Build
 *   machines should never need the runtime secret. So we cache lazily and
 *   fail fast on the first request that actually needs the key. By then
 *   NODE_ENV is the server's runtime value, and an under-length prod secret
 *   fails the FIRST request instead of the build step.
 */
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { AdminRole } from './permissions';
import { logger } from '@/lib/logger';
import { deriveRootDomain } from '@/lib/domains';

// Bypass policy + hasProductionSecret live in bypass.ts so the edge-runtime
// proxy (proxy.ts) and this server-only module share a single source of truth
// without dragging jose / next/headers into the edge bundle.
import { isAuthBypassed, hasProductionSecret, assertNoDangerousBypassInProduction } from './bypass';
// Re-export so existing imports from '@/lib/auth/session' keep working.
export { isAuthBypassed, hasProductionSecret, assertNoDangerousBypassInProduction };

const COOKIE_NAME = 'okn-session';
const REFRESH_COOKIE_NAME = 'okn-refresh';
const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = 'dev-insecure-secret-change-me';

let cachedSecret: Uint8Array | null = null;

/**
 * Resolve the JWT signing secret from env. LAZY: only called on first real
 * use (createSession / getSession), never at module import. This keeps
 * `next build` (which imports every route module during page-data collection)
 * from requiring the runtime secret to be present on the build machine.
 *
 * Exported so the security test can target the policy directly without
 * booting the request-bound cookie layer.
 */
export function resolveSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  const raw = process.env.JWT_SECRET;
  // Dev/test fallback — explicit fallback for standalone dashboard
  const effective = raw ?? DEV_FALLBACK_SECRET;
  cachedSecret = new TextEncoder().encode(effective);
  return cachedSecret;
}

/** Test-only: clear the cached secret so env changes take effect on next resolve. */
export function __resetSecretCacheForTests(): void {
  cachedSecret = null;
}

const TTL_SECONDS = Number(process.env.JWT_TTL ?? 900);
// Refresh cookie lives 30 days (matches REFRESH_TTL_MS in db/sessions.ts).
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface SessionPayload extends JWTPayload {
  sub: string; // user id
  telegramId?: string | null;
  walletAddress?: string | null;
  adminRole?: AdminRole | null;
  /** User's tokenVersion at issue time. getSession rejects if it's stale. */
  ver?: number;
  /** Session row id. getSession rejects if the row is revoked/expired. */
  sid?: string;
}

/**
 * Mock session used when DEV_AUTH_BYPASS=true. Super admin so every area is
 * reachable. sub is a nil UUID so Postgres uuid comparisons stay valid.
 *
 * DEV-SAFETY: getSession returns this BEFORE any DB lookup, so the dev bypass
 * never touches the sessions table and can't be locked out by tokenVersion /
 * revocation checks.
 */
export const DEV_SESSION: SessionPayload = {
  sub: '00000000-0000-0000-0000-000000000000',
  telegramId: 'dev-bypass',
  adminRole: 'super_admin',
};

// Cookie options for the session + refresh cookies.
//
// domain: in production (subdomain split active), set a parent dot-domain
//   (.okntoken.com) so the okn-session/okn-refresh cookies are shared across
//   the apex, app, and admin subdomains (single sign-on). In dev,
//   deriveRootDomain returns undefined -> host-only cookie (current behavior).
//
// sameSite: 'lax' (was 'strict'). After the split, login lives on the apex and
//   the post-auth redirect navigates the browser to app.<root>. A top-level
//   cross-site navigation carries cookies under 'lax' (strict would drop them
//   on the redirect, logging the user out immediately). 'lax' still blocks
//   cross-site subrequests/CSRF on state-changing verbs, so it is safe here.
//   The rate limiter + JWT signing remain the real auth-security boundary.
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: deriveRootDomain(process.env.NEXT_PUBLIC_APP_URL),
};

export async function createSession(
  payload: Omit<SessionPayload, 'iat' | 'exp'> & { ver: number; sid: string; refreshToken: string; refreshTokenExpiresAt: Date },
): Promise<void> {
  const { refreshToken, refreshTokenExpiresAt: _refreshTokenExpiresAt, ver, sid, ...rest } = payload;
  const token = await new SignJWT({ ...rest, ver, sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(resolveSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: TTL_SECONDS });
  // Refresh token: separate cookie, longer-lived. Cleared on logout.
  store.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_TTL_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  // BOOT GUARD: refuse to proceed if the dev auth bypass is enabled in a
  // production runtime. Belt-and-suspenders on top of the secret-quality check
  // inside isAuthBypassed() — runs lazily on the first auth-touching request
  // (never at module import, so `next build` is unaffected).
  assertNoDangerousBypassInProduction();
  // DEV-SAFETY: bypass returns BEFORE any DB lookup, so dev sessions are never
  // subject to tokenVersion/revocation/ban checks. No dev lockout possible.
  if (isAuthBypassed()) return DEV_SESSION;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload: SessionPayload;
  try {
    const verified = await jwtVerify(token, resolveSecret(), { algorithms: ['HS256'] });
    payload = verified.payload as SessionPayload;
  } catch (err) {
    // Log the verification failure with the reason (invalid signature, expired,
    // tampered, alg mismatch) so a forgery or brute-force campaign is visible.
    // Never log the token itself.
    const reason =
      err instanceof Error
        ? err.message.includes('exp')
          ? 'expired'
          : err.message.includes('signature')
            ? 'invalid-signature'
            : err.message.includes('alg')
              ? 'wrong-algorithm'
              : 'verification-failed'
        : 'unknown-error';
    logger.warn('JWT verification failed', { reason });
    return null;
  }

  // Stateless fast path for standalone dashboard
  return payload;
}

export async function clearSession(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(COOKIE_NAME);
    store.delete(REFRESH_COOKIE_NAME);
  } catch {
    // Cookie store unavailable
  }
}

/** Read the refresh-token cookie value (used by /api/auth/refresh). */
export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

/** Clear only the refresh cookie (used after a failed refresh rotation). */
export async function clearRefreshCookie(): Promise<void> {
  const store = await cookies();
  store.delete(REFRESH_COOKIE_NAME);
}

/** Set a new refresh-token cookie (used by the refresh rotation). */
export async function setRefreshCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(REFRESH_COOKIE_NAME, token, {
    ...COOKIE_OPTS,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
}
