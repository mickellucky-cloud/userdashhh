/**
 * lib/domains.ts — subdomain origin helpers for the app/admin/apex split.
 *
 * Production layout:
 *   - apex (okntoken.com)       -> marketing + login (shared entry point)
 *   - app.okntoken.com           -> localized user dashboard ([locale]/app/*)
 *   - admin.okntoken.com         -> English-only admin panel (/admin/*)
 *
 * Local development: none of the NEXT_PUBLIC_*_SUBDOMAIN_URL vars are set, so
 * every helper below returns '' (empty string). That makes all cross-area URLs
 * relative and preserves the current single-origin behavior on localhost —
 * localhost:3000/app, /admin, /login all keep working unchanged. This is the
 * "subdomain rules only in production" decision.
 *
 * Session cookies (lib/auth/session.ts) use deriveRootDomain() to set a parent
 * dot-domain so the okn-session/okn-refresh cookies are shared across all three
 * hosts (single sign-on).
 */

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/**
 * Whether subdomain routing is active. True only when the app subdomain env
 * var is set (production). On localhost this is false -> relative URLs.
 */
export function isSubdomainSplitActive(): boolean {
  return !!process.env.NEXT_PUBLIC_APP_SUBDOMAIN_URL;
}

/**
 * Whether the CURRENT browser request is on the app subdomain. Client-only
 * (reads window.location). Returns false during SSR and on the apex/admin
 * subdomain / localhost. Used to strip the /app prefix from rendered hrefs so
 * the URL bar shows app.okntoken.com/referral (not /app/referral).
 */
export function isOnAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const appHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_SUBDOMAIN_URL ?? '').hostname;
    } catch {
      return '';
    }
  })();
  return !!appHost && host === appHost;
}

/**
 * Strip the leading '/app' from a path when rendering a link ON the app
 * subdomain, so the URL bar shows the bare path (app.okntoken.com/referral
 * instead of /app/referral). The internal rewrite still maps /referral back to
 * /app/referral, and usePathname()/active-detection keep using /app/* paths.
 *
 * No-op on the apex, admin subdomain, localhost, or for non-/app paths.
 */
export function bareAppHref(href: string): string {
  if (!isOnAppSubdomain()) return href;
  // '/app' -> '/', '/app/referral' -> '/referral'
  if (href === '/app') return '/';
  if (href.startsWith('/app/')) return href.slice('/app'.length); // '/referral'
  return href;
}

/** User dashboard origin (https://app.okntoken.com), or '' in dev. */
export function appOrigin(): string {
  const v = process.env.NEXT_PUBLIC_APP_SUBDOMAIN_URL;
  return v ? stripTrailingSlash(v) : '';
}

/** Admin panel origin (https://admin.okntoken.com), or '' in dev. */
export function adminOrigin(): string {
  const v = process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN_URL;
  return v ? stripTrailingSlash(v) : '';
}

/** Apex (marketing + login) origin (https://okntoken.com), or '' in dev. */
export function apexOrigin(): string {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  // Keep the dev fallback out of this helper: when the split is NOT active we
  // want '' (relative), not 'http://localhost:3000'. isSubdomainSplitActive
  // gates prod mode.
  if (!isSubdomainSplitActive()) return '';
  return v ? stripTrailingSlash(v) : '';
}

/**
 * Build the login URL. In prod this is an absolute apex URL; in dev it is the
 * relative /login (or /{locale}/login) path. The optional `next` is appended
 * URL-encoded so the post-login redirect returns to the right place.
 *
 * @param next    Where to send the user after a successful login. In prod this
 *                is typically an absolute subdomain URL
 *                (https://app.okntoken.com/es/app/portfolio); in dev it stays a
 *                relative path (/app/portfolio).
 * @param locale  Active locale. The default locale ('en') yields no prefix.
 */
export function loginUrl(next?: string, locale?: string): string {
  const prefix = !locale || locale === 'en' ? '' : `/${locale}`;
  const base = `${apexOrigin()}${prefix}/login`;
  if (!next) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}

/**
 * Derive the parent dot-domain for the session cookie's `domain` attribute, so
 * the cookie is shared across apex + app + admin subdomains (SSO).
 *
 *   'https://okntoken.com'        -> '.okntoken.com'
 *   'https://app.okntoken.com'    -> '.okntoken.com'
 *   'http://localhost:3000'       -> undefined  (host-only cookie, dev)
 *   '' / undefined                -> undefined
 *
 * Returns undefined when the URL is absent or is localhost (dev), so the cookie
 * defaults to host-only scope — the current pre-split behavior.
 */
export function deriveRootDomain(appUrl: string | undefined): string | undefined {
  if (!appUrl) return undefined;
  let host: string;
  try {
    host = new URL(appUrl).hostname;
  } catch {
    return undefined;
  }
  if (!host || host === 'localhost' || host.endsWith('.localhost')) return undefined;
  // IP literal (dev/CI) -> no dot-domain.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return undefined;
  // Take the last two labels (e.g. okntoken.com) and prefix with a dot.
  const labels = host.split('.');
  if (labels.length < 2) return undefined;
  const root = labels.slice(-2).join('.');
  return `.${root}`;
}
