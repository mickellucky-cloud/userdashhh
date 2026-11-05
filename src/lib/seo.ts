/**
 * lib/seo.ts — non-translatable SEO constants.
 *
 * Translatable SEO copy (title, description, keywords) now lives in
 * messages/{locale}.json under the `metadata` namespace and is read per-locale
 * via next-intl's getTranslations in each layout/page. This file keeps only
 * the structural, locale-independent values: the canonical origin, brand name,
 * social handles, theme color, and the public-route list used by the sitemap.
 *
 * NEXT_PUBLIC_APP_URL is the canonical origin (with trailing slash stripped).
 * Defaults to localhost for dev; override via env in production.
 */
const RAW_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
export const SITE_URL = RAW_URL.endsWith('/') ? RAW_URL.slice(0, -1) : RAW_URL;

export const SITE = {
  // Brand proper noun — not translated (it's a product name).
  name: 'OKN Token',
  url: SITE_URL,
  // 1200x630 is the canonical OG image size. Falls back to the OKN coin asset
  // until a dedicated OG image is designed.
  ogImage: `${SITE_URL}/OKN.png`,
  twitter: '@okn',
  themeColor: '#007AFF',
  // Used in JSON-LD as the org behind the token.
  logo: `${SITE_URL}/OKN.png`,
} as const;

/**
 * Build a locale-prefixed URL for a route path, following the routing config
 * (`as-needed`): the default locale (en) gets no prefix; others get /es, /fr...
 * Used by the sitemap and by per-page metadata alternates for hreflang.
 */
export function localizedUrl(locale: string, path: string): string {
  const isDefault = locale === 'en'; // matches routing.defaultLocale
  const prefix = isDefault ? '' : `/${locale}`;
  const tail = path === '/' ? '' : path;
  return `${SITE.url}${prefix}${tail}`;
}

/**
 * Public, indexable route paths (locale-agnostic — the sitemap multiplies these
 * across every configured locale). Auth-gated routes (/app, /admin) are excluded.
 */
export const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/login', changeFrequency: 'monthly' as const, priority: 0.6 },
  // These standalone marketing pages ship in Phase 7 (7.3, 7.4).
  { path: '/tokenomics', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/how-to-claim', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/documents', changeFrequency: 'monthly' as const, priority: 0.8 },
];

/**
 * JSON-LD structured data for the landing page. Translatable fields (name,
 * description) are passed in by the caller from the active locale's messages.
 */
export function landingJsonLd(args: { name: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: args.name,
    url: SITE.url,
    description: args.description,
    potentialAction: {
      '@type': 'ViewAction',
      target: `${SITE.url}/app`,
      name: 'Open OKN dashboard',
    },
  };
}

/**
 * JSON-LD for the OKN token as a financial instrument (CryptoCurrency).
 */
export function tokenJsonLd(args: { description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CryptoCurrency',
    name: 'OKN Token',
    symbol: 'OKN',
    url: SITE.url,
    description: args.description,
    blockchain: 'BNB Smart Chain',
    identifier: process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS || 'TBD',
  };
}
