'use client';

/**
 * components/layout/silent-refresher.tsx
 *
 * Periodically calls POST /api/auth/refresh to renew the short-lived access
 * JWT before it expires (default TTL 15 min). This keeps users logged in across
 * long sessions without the jarring 15-min force-logout that a pure-stateless
 * JWT would impose.
 *
 * On a 401 (refresh token invalid/expired), the refresh cookie is cleared and
 * no further attempts are made until the next login. The next protected
 * navigation will redirect to /login via the server-side guard.
 *
 * Mounted once inside AppShell so it covers both the user dashboard and admin
 * panel. Uses setInterval; cleaned up on unmount. Visibility API is respected:
 * the timer still fires but the refresh is cheap, and a tab regaining focus
 * after hours will silently re-establish a live session if the refresh token
 * (30-day TTL) is still valid.
 */
import { useEffect } from 'react';

// Refresh at 2/3 of the access-JWT TTL (default TTL 900s -> refresh ~10min).
// This leaves a margin so the token doesn't expire mid-request.
const REFRESH_INTERVAL_MS = Math.round((Number(process.env.NEXT_PUBLIC_JWT_TTL ?? 900) * 1000) * (2 / 3));

export function SilentRefresher() {
  useEffect(() => {
    let active = true;

    async function doRefresh() {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
        if (!active) return;
        // 401 -> refresh token invalid/expired; stop trying. The next protected
        // navigation will redirect to login server-side. Don't force a redirect
        // here — the user may be reading a page that doesn't require a live JWT.
        if (res.status === 401) {
          clearInterval(id);
        }
      } catch {
        // Network error (offline, dev server restart) — ignore; next tick retries.
      }
    }

    // First refresh shortly after mount (in case the page loaded with a
    // near-expiry token), then on the interval.
    const initial = setTimeout(doRefresh, 60_000);
    const id = setInterval(doRefresh, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  return null;
}
