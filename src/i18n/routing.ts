/**
 * i18n/routing.ts — locale routing config (single source of truth).
 *
 * `as-needed` prefix: the default locale (en) is served at `/` (no prefix);
 * every other locale gets its own prefix (`/es`, `/fr`, `/zh`, ...). This
 * keeps the primary English URLs clean while still giving every other language
 * a shareable, indexable URL. The middleware negotiates the visitor's preferred
 * locale from the Accept-Language header on first visit and redirects there.
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'es', 'pt', 'ru', 'vi', 'id', 'tr', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
