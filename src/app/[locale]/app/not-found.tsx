'use client';

/**
 * app/app/not-found.tsx — dashboard-scoped 404.
 *
 * Catches any URL under /app/* that doesn't match a real route (e.g.
 * /app/somthing-misspelled). Renders INSIDE the /app layout, so the user keeps
 * the full dashboard chrome (sidebar, header, avatar). They stay signed in and
 * can navigate anywhere from here. The CTA sends them to /app/portfolio (the
 * dashboard home) rather than kicking them out to the public site.
 *
 * No auto-redirect: a 404 that immediately bounces breaks the back button and
 * is disorienting. Show the page with a clear CTA instead.
 *
 * Animation: staggered entrance + a gentle perpetual pulse on the icon tile so
 * the page reads as "alive, recovering" rather than a dead end. Respects
 * prefers-reduced-motion (the pulse + float become static).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AppNotFound() {
  const reduce = useReducedMotion();
  const t = useTranslations('dashboard.notFound');

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: reduce ? 0 : 0.04 },
    },
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex max-w-md flex-col items-center"
      >
        {/* Large 404 — subtle perpetual float so the page never looks frozen. */}
        <motion.div
          variants={item}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p className="font-display text-[6rem] leading-none font-extrabold tracking-tighter text-ios-blue md:text-[8rem]">
            404
          </p>
        </motion.div>

        {/* Icon tile with a slow pulse ring — a "beacon" suggesting a way out. */}
        <motion.div variants={item} className="relative mt-2">
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-2xl bg-ios-blue/30"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <span className="relative flex size-14 items-center justify-center rounded-2xl bg-ios-blue/10">
            <LayoutDashboard className="size-7 text-ios-blue" />
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-6 font-display text-xl font-extrabold tracking-tight md:text-2xl"
        >
          {t('heading')}
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-2 text-balance text-sm leading-relaxed text-muted-foreground md:text-base"
        >
          {t('body')}
        </motion.p>

        <motion.div variants={item}>
          <Link
            href="/app/portfolio"
            className="mt-7 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-ios-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-ios-blue/25 active:scale-[0.97]"
          >
            <ArrowLeft className="size-4" />
            {t('backToDashboard')}
          </Link>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
        >
          <Link href="/app/tasks" className="transition-colors hover:text-foreground">
            {t('tasks')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/app/wallet" className="transition-colors hover:text-foreground">
            {t('wallet')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/app/buy" className="transition-colors hover:text-foreground">
            {t('buy')}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/app/settings" className="transition-colors hover:text-foreground">
            {t('settings')}
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
