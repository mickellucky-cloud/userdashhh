/**
 * app/layout.tsx — root layout (shared by ALL routes).
 *
 * This is the single root layout for the whole app: both the localized public
 * routes (under [locale]/) and the non-localized routes (/app dashboard,
 * /admin, /api) render inside this shell. It owns <html> and <body>.
 *
 * <html lang="en">:
 *   Next.js only allows the lang attribute to be set on the root layout. Since
 *   this layout is shared with non-localized routes (the dashboard), we can't
 *   make it dynamic per-locale here. The localized content under [locale]/ is
 *   still fully translated via next-intl (NextIntlClientProvider in the
 *   [locale] layout); only the document-level lang attribute reflects the
 *   shell default. When the dashboard moves under [locale] in a later phase,
 *   lang will become dynamic.
 *
 * AppKit is loaded dynamically ONLY in /app/* routes (where wallet is needed).
 * The root layout stays clean to avoid chunk corruption from Lit web components.
 *
 * Fonts: the design uses the native system stack directly (no next/font/google).
 * On Apple devices that's SF Pro (the canonical iOS face this design targets);
 * on Windows/Android it's Segoe UI / Roboto. This avoids every build-time
 * network call to fonts.googleapis.com, so dev/build never stall or warn on
 * offline/restricted networks. The stack is defined in globals.css
 * (--font-sans and --font-display).
 */
import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import '../styles/responsive.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SITE, landingJsonLd, tokenJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'OKN Token', // overridden per-locale in [locale]/layout.tsx
    template: `%s | ${SITE.name}`,
  },
  applicationName: SITE.name,
  manifest: '/site.webmanifest',
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    creator: SITE.twitter,
    images: ['/OKN.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: SITE.themeColor,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the marketing theme no-flash script adds the
    // `dark` class to <html> before React hydrates (same pattern as
    // next-themes); React must not warn about that intentional mutation.
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('okn_theme')||localStorage.getItem('okn-theme:app')||'dark';document.documentElement.setAttribute('data-theme',t);if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Structured data for search engines. Inline JSON-LD is the
            documented pattern for App Router (next/script also works but adds
            a deferred script tag; inline guarantees crawlers see it). Uses
            sensible English defaults; localized values are provided by the
            [locale] layout's metadata where relevant. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              landingJsonLd({
                name: SITE.name,
                description:
                  'OKN is a community token on BNB Smart Chain. Earn via tasks, claim on-chain with Merkle proofs, or buy directly with BNB at a fixed rate.',
              }),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              tokenJsonLd({
                description:
                  'OKN is a community token on BNB Smart Chain. Earn via tasks, claim on-chain with Merkle proofs, or buy directly with BNB at a fixed rate.',
              }),
            ),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
