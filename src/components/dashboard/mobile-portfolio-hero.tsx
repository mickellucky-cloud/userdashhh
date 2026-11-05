'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Flame, Eye, EyeOff, Users, ChevronRight } from 'lucide-react';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useStreak } from '@/lib/hooks/use-rewards';
import { formatPoints } from '@/lib/utils';

/**
 * MobilePortfolioHero — Card 1 on mobile portfolio.
 * Positioned at the very top of the mobile screen above the segmented switcher.
 */
export function MobilePortfolioHero() {
  const eligibility = useClaimEligibility();
  const streak = useStreak();

  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('okn_hide_balance') === 'true';
      setHideBalance(stored);
    } catch {}
  }, []);

  const toggleBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('okn_hide_balance', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const points = eligibility.data?.points ?? 135;
  const currentDays = streak.data?.currentStreak ?? 6;

  return (
    <div className="relative overflow-hidden -mx-4 -mt-6 rounded-none rounded-b-[32px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-5 pt-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-[#E4D3FF]">Your OK Points</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
          <Flame className="size-3.5 fill-current" />
          <span>{currentDays}-day streak</span>
        </span>
      </div>

      <div className="num text-5xl font-extrabold tracking-tight mb-4">
        {formatPoints(points)}
      </div>

      {/* Nested Frosted Glass Total Asset Value Card */}
      <div className="rounded-[22px] border border-white/15 bg-black/25 p-4 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E6D7FF]/85">
              <span>Total Asset Value</span>
              <button
                type="button"
                onClick={toggleBalance}
                className="balance-eye-btn p-0.5 text-white/90 hover:text-white cursor-pointer"
                aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="num text-2xl font-extrabold text-white leading-tight mt-1">
              {hideBalance ? '••••••••' : '$1,428.50'}
            </div>
          </div>
          <span className="rounded-xl border border-[#2FBD8E]/40 bg-[#2FBD8E]/25 px-2.5 py-1 text-[11px] font-extrabold text-[#4EEDB2]">
            +$142.50 (24h)
          </span>
        </div>

        <div className="h-[1px] bg-white/15" />

        {/* Referral Earnings shortcut — Cleanly arranged & structured */}
        <Link
          href="/app/referral"
          className="flex items-center justify-between rounded-2xl bg-white/[0.08] p-3 hover:bg-white/[0.14] active:scale-98 transition-all gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
              <Users className="size-4 text-white" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#E9DAFF] tracking-wide">
                Referral Earnings
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="num text-sm font-extrabold text-white">
                  {hideBalance ? '••••••' : '$142.50'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FFD60A]">
                  <img src="/bnb-logo.png" alt="BNB" className="size-3 object-contain" />
                  (0.238 BNB)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white shrink-0">
            <span>14 friends</span>
            <ChevronRight className="size-3.5 opacity-80" />
          </div>
        </Link>
      </div>
    </div>
  );
}
