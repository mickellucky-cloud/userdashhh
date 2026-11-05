/**
 * app/[locale]/layout.tsx — locale-scoped layout for all public/localized routes.
 *
 * Nested inside the root layout (which owns <html>/<body>), this layout:
 *   - validates the [locale] param against the configured locales,
 *   - calls setRequestLocale so server components can statically render,
 *   - provides NextIntlClientProvider so every client component under it can
 *     use useTranslations,
 *   - generates per-locale SEO metadata (title, description, keywords, OG).
 *
 * `generateStaticParams` pre-renders every known locale at build time.
 */
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { SITE } from '@/lib/seo';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Pre-render every locale at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function validateLocale(locale: string): asserts locale is Locale {
  if (!routing.locales.includes(locale as Locale)) notFound();
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    keywords: t.raw('keywords') as string[],
    openGraph: {
      type: 'website',
      url: SITE.url,
      siteName: SITE.name,
      title: t('title'),
      description: t('description'),
      images: [
        {
          url: '/OKN.png',
          width: 748,
          height: 751,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/OKN.png'],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  validateLocale(locale);

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  // Load the message catalog for this locale.
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}
