'use client';

/**
 * app/[locale]/not-found.tsx — 404 for the localized public site.
 *
 * Catches any localized URL that doesn't match a public route. Renders inside
 * the [locale] layout (which provides NextIntlClientProvider), so this page
 * can use useTranslations for its copy.
 *
 * Auto-redirect is deliberately NOT used: a hard redirect on a 404 breaks the
 * browser back button and confuses users who mis-typed a URL. Instead we show
 * the page with a clear CTA. The big "404" is decorative; the actionable text
 * ("Take me home") is what the user actually needs.
 *
 * Animation: a gentle staggered entrance (logo -> 404 -> icon -> heading -> CTA
 * -> links) so the page feels alive rather than a dead end. The 404 digits get
 * a subtle perpetual float (transform/opacity only, GPU-cheap) so the page
 * never looks frozen. Every animation respects prefers-reduced-motion.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function NotFound() {
  const t = useTranslations('notFound');
  const reduce = useReducedMotion();

  // Staggered entrance container. Children appear one after another so the eye
  // lands on the brand, then the 404, then the recovery path.
  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: reduce ? 0 : 0.05 },
    },
  };
  // Each child fades + rises in (transform/opacity only -> no layout shift).
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE },
    },
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ios-gray6 px-6 text-center antialiased">
      {/* Soft decorative backdrop — two blurred color blobs. Pointer-events-none
          so they never intercept taps; aria-hidden so screen readers skip them.
          Slow drift gives the page a living quality without competing for focus. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-32 size-96 rounded-full bg-ios-blue/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, 24, 0], y: [0, 18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-24 size-96 rounded-full bg-ios-indigo/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, -20, 0], y: [0, -14, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex max-w-md flex-col items-center"
      >
        {/* Brand mark */}
        <motion.div variants={item}>
          <Link href="/" className="mb-10 flex items-center gap-2">
            <Image src="/OKN.png" alt={t('logoAlt')} width={36} height={36} className="size-9" />
            <span className="font-display text-lg font-bold tracking-tight">$OKN</span>
          </Link>
        </motion.div>

        {/* Giant 404 — gradient text, perpetual subtle float. Decorative-only:
            aria-hidden so the screen reader just hears the heading below. */}
        <motion.div
          variants={item}
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p
            aria-hidden
            className="font-display text-[7rem] leading-none font-extrabold tracking-tighter text-transparent md:text-[9rem]"
            style={{
              backgroundImage: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            404
          </p>
        </motion.div>

        <motion.span
          variants={item}
          className="mt-4 flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
        >
          <Compass className="size-7 text-ios-blue" />
        </motion.span>

        <motion.h1
          variants={item}
          className="mt-6 font-display text-2xl font-extrabold tracking-tight md:text-3xl"
        >
          {t('heading')}
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-3 text-balance text-sm leading-relaxed text-ios-label-secondary md:text-base"
        >
          {t('body')}
        </motion.p>

        <motion.div variants={item}>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-ios-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-ios-blue/25 active:scale-[0.97]"
          >
            <ArrowLeft className="size-4" />
            {t('cta')}
          </Link>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-6 flex items-center gap-4 text-xs text-ios-gray"
        >
          <Link href="/tokenomics" className="transition-colors hover:text-foreground">
            {t('links.0')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/how-to-claim" className="transition-colors hover:text-foreground">
            {t('links.1')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/documents" className="transition-colors hover:text-foreground">
            {t('links.2')}
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
