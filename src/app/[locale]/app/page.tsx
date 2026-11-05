/**
 * [locale]/app — permanently redirects to /app/portfolio.
 *
 * The former "Overview" page content now lives in the Activity tab of the
 * merged Portfolio page. The 308 (permanent) redirect ensures:
 *   - Existing bookmarks and links (sidebar, marketing nav/footer,
 *     how-to-claim CTA) all land on the merged page.
 *   - Search engines update their index to the canonical URL.
 *
 * This module runs on the server (no 'use client') so the redirect happens
 * before any client JS loads — no flash of content, no client-side navigation.
 */
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export default async function AppIndexRedirect({ params }: Props) {
  const { locale } = await params;
  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }
  // Locale-aware redirect: next-intl's redirect adds the locale prefix.
  redirect({ href: '/app/portfolio', locale: locale as Locale });
}
