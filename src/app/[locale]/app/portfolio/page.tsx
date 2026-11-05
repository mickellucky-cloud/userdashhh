'use client';

/**
 * /app/portfolio — Modern Web3 Portfolio & User Dashboard.
 *
 * Segmented Header Switcher:
 *   Overview — 4 KPI stat cards, announcement carousel, total asset valuation hero,
 *              streak visualizer, Merkle claim stepper, and Presale buy card.
 *   Activity Log — Audit Trail historical records, filter pills (All / OK Points / $OKN).
 *   Holdings — Seamlessly routes directly to /app/wallet.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { OverviewView } from '@/components/dashboard/overview-view';
import { ActivityLogView } from '@/components/dashboard/activity-log-view';
import { MobilePortfolioHero } from '@/components/dashboard/mobile-portfolio-hero';

export default function PortfolioPage() {
  const t = useTranslations('dashboard.portfolio');
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'overview' | 'activity'>('overview');

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested === 'activity') {
      setTab('activity');
    } else {
      setTab('overview');
    }
  }, [searchParams]);

  return (
    <main className="space-y-4 md:space-y-6">
      {/* Mobile Card 1: Purple Hero Card at very top */}
      <div className="block md:hidden">
        <MobilePortfolioHero />
      </div>

      {/* Mobile Card 2: Segmented Switcher directly underneath Card 1, before slider */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--s2)] border border-[var(--line)] shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              tab === 'overview'
                ? 'bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_2px_12px_rgba(122,18,245,0.45)]'
                : 'text-[var(--mut)] hover:text-[var(--tx)] active:scale-95'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('activity')}
            className={`flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              tab === 'activity'
                ? 'bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_2px_12px_rgba(122,18,245,0.45)]'
                : 'text-[var(--mut)] hover:text-[var(--tx)] active:scale-95'
            }`}
          >
            Activity
          </button>
          <Link
            href="/app/wallet"
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Holdings
          </Link>
        </div>
      </div>

      {/* Desktop Header with integrated switcher */}
      <div className="hidden md:flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--mut)]">
            {t('description')}
          </p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              tab === 'overview'
                ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('activity')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              tab === 'activity'
                ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            Activity
          </button>
          <Link
            href="/app/wallet"
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-all cursor-pointer"
          >
            Holdings
          </Link>
        </div>
      </div>

      <div className="mt-2 md:mt-5">
        {tab === 'overview' ? <OverviewView onSelectActivity={() => setTab('activity')} /> : <ActivityLogView />}
      </div>
    </main>
  );
}
