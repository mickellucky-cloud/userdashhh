/**
 * i18n/request.ts — server-side message loader.
 *
 * next-intl calls getRequestConfig on every request to determine the active
 * locale and which message catalog to load. We validate the locale from the
 * `[locale]` segment (falling back to the default if it's missing or unknown)
 * and dynamically import the matching JSON from apps/web/messages/.
 */
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` comes from the [locale] segment via setRequestLocale.
  let locale = await requestLocale;

  // Guard against unknown / missing locales (e.g. static asset paths, 404s).
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
