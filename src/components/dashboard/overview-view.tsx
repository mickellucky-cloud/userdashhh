'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Coins,
  Download,
  Eye,
  EyeOff,
  Flame,
  Gift,
  ListChecks,
  Plus,
  ShoppingCart,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { TransactionHistory } from '@/components/dashboard/transaction-history';
import { AnnouncementCarousel } from '@/components/dashboard/announcement-carousel';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useReferral } from '@/lib/hooks/use-referral';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useSalePrice } from '@/lib/hooks/use-sale';
import { useStreak } from '@/lib/hooks/use-rewards';
import { formatPoints, formatWei } from '@/lib/utils';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

export function OverviewView({ onSelectActivity }: { onSelectActivity?: () => void } = {}) {
  const t = useTranslations('dashboard.activity');
  const eligibility = useClaimEligibility();
  const tasks = useTasks();
  const referral = useReferral();
  const balance = useOknBalance();
  const sale = useSalePrice();
  const streak = useStreak();
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();

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
  const isClaimOpen = eligibility.data?.latestRootVersion != null;
  const taskList = tasks.data ?? [];
  const doneCount = taskList.filter((t) => t.completionStatus != null).length;
  const currentDays = streak.data?.currentStreak ?? 6;
  const longestStreak = streak.data?.longestStreak ?? 6;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          DESKTOP & TABLET VIEW (md and up)
          ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Account Total Asset Valuation Hero Card with Hide/Unhide Toggle */}
        <div
          className="flex flex-wrap items-center justify-between gap-4.5 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm transition-all"
          style={{
            background:
              'linear-gradient(135deg, rgba(122, 18, 245, 0.22) 0%, rgba(9, 180, 255, 0.12) 100%), var(--s1)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div className="flex items-center gap-5">
            <div
              className="flex size-[54px] shrink-0 items-center justify-center rounded-[16px] text-white shadow-[0_0_20px_rgba(122,18,245,0.4)]"
              style={{ background: 'var(--vio, #7A12F5)' }}
            >
              <Wallet className="size-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
                  Total Asset Balance
                </span>
                <button
                  type="button"
                  onClick={toggleBalance}
                  className="balance-eye-btn flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                  aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="num text-3xl font-extrabold text-[var(--tx)]">
                  {hideBalance ? '••••••••' : '$1,428.50'}
                </span>
                <span className="rounded-lg bg-[#2FBD8E]/15 px-2.5 py-0.5 text-xs font-extrabold text-[#2FBD8E]">
                  +$142.50 (24h)
                </span>
              </div>
            </div>
          </div>

          {/* Referral Earnings Summary Badge */}
          <Link
            href="/app/referral"
            className="flex items-center gap-3.5 rounded-[18px] border border-[var(--line)] bg-[var(--s2)] px-5 py-3.5 hover:scale-[1.02] active:scale-98 transition-all"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,214,10,0.15)] text-[#FFD60A]">
              <Users className="size-5" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
                Referral Earnings
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="num text-lg font-extrabold text-[var(--tx)]">
                  {hideBalance ? '••••••' : '$142.50 USD'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F0B90B]">
                  <img src="/bnb-logo.png" alt="BNB" className="size-3.5 object-contain" />
                  0.238 BNB
                </span>
              </div>
            </div>
            <span className="ml-1.5 text-xs font-bold text-[#C9A6FF]">14 invites →</span>
          </Link>
        </div>

        {/* 4 KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Gift}
            tint="indigo"
            label="OK Points earned"
            value={formatPoints(points)}
            hint="Awaiting Merkle commit"
          />
          <StatCard
            icon={Coins}
            tint="blue"
            label="$OKN balance"
            value={balance.data != null ? formatWei(balance.data) : '—'}
            hint="On-chain balance"
          />
          <StatCard
            icon={ListChecks}
            tint="green"
            label="Tasks done"
            value={`${doneCount} / ${taskList.length || 11}`}
            hint="555 points available"
          />
          <Link href="/app/referral" className="block text-inherit">
            <StatCard
              icon={Users}
              tint="orange"
              label="Referral Earnings"
              value={hideBalance ? '••••••' : '$142.50'}
              hint="0.238 BNB · 14 friends invited"
            />
          </Link>
        </div>

        {/* Daily Streak Card with 7-Day Capsule Visualizer */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(255,170,0,0.15)] text-[#FFAA00]">
              <Flame className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-[var(--mut)] uppercase">Daily streak</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-3">
                <p className="num text-2xl font-extrabold tracking-tight text-[var(--tx)]">
                  {currentDays} days
                </p>
                <p className="text-xs font-medium text-[var(--mut)]">
                  Checked in. Longest streak: {longestStreak}.
                </p>
              </div>
            </div>
          </div>

          {/* 7 Glowing Streak Capsules */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isFilled = day <= currentDays;
              return (
                <div
                  key={day}
                  title={`Day ${day}`}
                  className={`w-3.5 h-9 rounded-md transition-all ${
                    isFilled
                      ? 'bg-gradient-to-b from-[#8C38F7] to-[#7A12F5] shadow-[0_0_8px_rgba(122,18,245,0.4)]'
                      : 'border-1.5 border-dashed border-[var(--line)] bg-[var(--s2)] opacity-60'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Announcements Slider placed directly under 6-day streak area on web & tablets */}
        <AnnouncementCarousel id="desktop-ann-carousel" />

        {/* Two-Column Split Grid (3fr : 2fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Column: Claim + Buy (span 3) */}
          <div className="space-y-5 lg:col-span-3">
            {/* Claim your $OKN Card */}
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3.5">
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--tx)]">Claim your $OKN</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--mut)] md:text-sm">
                    OK Points convert to $OKN when the admin commits a Merkle root. A $3 BNB fee applies at claim time.
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-[rgba(255,170,0,0.25)] bg-[rgba(255,170,0,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#FFAA00]">
                  {isClaimOpen ? 'Open now' : 'Not open yet'}
                </span>
              </div>

              {/* Merkle Stepper */}
              <div className="my-5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 md:p-5">
                <div className="relative flex items-center justify-between">
                  {/* Step 1: Earn points */}
                  <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                    <div className="flex size-7 items-center justify-center rounded-full bg-[#09B4FF] text-black font-extrabold shadow-[0_0_10px_rgba(9,180,255,0.4)]">
                      <Check className="size-4 stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--tx)]">Earn points</span>
                  </div>

                  {/* Connecting Line 1 */}
                  <div className="mx-2 -mt-4.5 h-[2px] flex-1 bg-gradient-to-r from-[#09B4FF] to-[#FFD60A]" />

                  {/* Step 2: Merkle commit */}
                  <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#FFD60A] bg-[var(--s1)] shadow-[0_0_10px_rgba(255,214,10,0.3)]">
                      <div className="size-2.5 rounded-full bg-[#FFD60A]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-[#FFD60A]">Merkle commit</span>
                  </div>

                  {/* Connecting Line 2 */}
                  <div className="mx-2 -mt-4.5 h-[2px] flex-1 border-t-2 border-dashed border-[var(--mut)] opacity-60" />

                  {/* Step 3: Claim on-chain */}
                  <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-[var(--mut)] bg-[var(--s2)] text-[var(--mut)] opacity-65">
                      <div className="size-2 rounded-full bg-[var(--mut)]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--mut)]">Claim on-chain</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-[rgba(255,170,0,0.15)]">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
                    Claimable OK Points
                  </p>
                  <p className="num text-3xl font-extrabold text-[#ffb800]">
                    {formatPoints(points)}
                  </p>
                </div>
                <Link
                  href="/app/claim"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#ffb800] text-black font-extrabold text-xs shadow-md transition-transform hover:scale-105"
                >
                  <span>Go to claim</span>
                  <ChevronRight className="size-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Buy $OKN with BNB Card */}
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Buy $OKN with BNB</h3>
                <p className="text-xs text-[var(--mut)] mt-1">
                  Fixed rate: {sale.data ? `1 BNB = ${formatWei(sale.data.rate)} $OKN` : '1 BNB = 1,000,000 $OKN'}
                </p>
              </div>
              <Link
                href="/app/buy"
                className="inline-flex items-center gap-2.5 h-11 px-5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] font-extrabold text-xs shadow-sm hover:border-[#7A12F5]/50 transition-colors"
              >
                <ShoppingCart className="size-4 text-[#09B4FF]" />
                <span>Open the sale</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Tasks Card (span 2) */}
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-extrabold text-[var(--tx)]">Tasks</h3>
              <Link href="/app/tasks" className="inline-flex items-center gap-1 text-xs font-bold text-[#C9A6FF] hover:underline">
                <span>See all</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <p className="text-xs text-[var(--mut)] mb-4">Earn OK Points toward your next claim.</p>

            {/* Branded Task Items */}
            <div className="space-y-2.5">
              {/* Telegram Task */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(9,180,255,0.15)] text-[#09B4FF]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--tx)]">Join our Telegram</p>
                    <p className="text-[11px] font-semibold text-[#2FBD8E]">+50 OK Points</p>
                  </div>
                </div>
                <Link
                  href="/app/tasks"
                  className="px-4 py-1.5 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-[0_2px_8px_rgba(122,18,245,0.35)] hover:bg-[#8C38F7] transition-colors"
                >
                  Claim
                </Link>
              </div>

              {/* Twitter / X Task */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--s1)] text-[var(--tx)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--tx)]">Follow us on X</p>
                    <p className="text-[11px] font-semibold text-[#2FBD8E]">+70 OK Points</p>
                  </div>
                </div>
                <Link
                  href="/app/tasks"
                  className="px-4 py-1.5 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-[0_2px_8px_rgba(122,18,245,0.35)] hover:bg-[#8C38F7] transition-colors"
                >
                  Claim
                </Link>
              </div>

              {/* Facebook Task */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)] hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(66,103,178,0.15)] text-[#4267B2]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#4267B2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--tx)]">Follow $OKN on Facebook</p>
                    <p className="text-[11px] font-semibold text-[#2FBD8E]">+50 OK Points</p>
                  </div>
                </div>
                <Link
                  href="/app/tasks"
                  className="px-4 py-1.5 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-[0_2px_8px_rgba(122,18,245,0.35)] hover:bg-[#8C38F7] transition-colors"
                >
                  Claim
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <TransactionHistory />
      </div>

      {/* =========================================================================
          MOBILE VIEW (< 768px)
          ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {/* Mobile Announcement Carousel (Slider directly underneath Card 2) */}
        <AnnouncementCarousel id="mobile-ann-carousel" />

        {/* 4 Quick Actions Row — Vibrant #7A12F5 purple background with pure white text and icon */}
        <div className="grid grid-cols-4 gap-2.5">
          <Link
            href="/app/tasks"
            className="flex flex-col items-center justify-center gap-2 h-[88px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <Check className="size-5 stroke-[2.5] text-white stroke-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white !text-white" style={{ color: '#ffffff' }}>Tasks</span>
          </Link>
          <Link
            href="/app/claim"
            className="flex flex-col items-center justify-center gap-2 h-[88px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <Download className="size-5 stroke-[2.5] text-white stroke-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white !text-white" style={{ color: '#ffffff' }}>Claim</span>
          </Link>
          <Link
            href="/app/buy"
            className="flex flex-col items-center justify-center gap-2 h-[88px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <Plus className="size-5 stroke-[2.5] text-white stroke-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white !text-white" style={{ color: '#ffffff' }}>Buy</span>
          </Link>
          <Link
            href="/app/referral"
            className="flex flex-col items-center justify-center gap-2 h-[88px] rounded-2xl bg-gradient-to-b from-[#7A12F5] to-[#660CD9] text-white shadow-[0_4px_14px_rgba(122,18,245,0.35)] border border-white/20 active:scale-95 transition-transform"
            style={{ backgroundColor: '#7A12F5', color: '#ffffff' }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <Users className="size-5 stroke-[2.5] text-white stroke-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
            </span>
            <span className="text-xs font-extrabold text-white !text-white" style={{ color: '#ffffff' }}>Invite</span>
          </Link>
        </div>

        {/* 2-Column Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* White Tasks Card */}
          <Link
            href="/app/tasks"
            className="flex flex-col justify-between h-[148px] rounded-[24px] bg-white text-black p-4 shadow-sm hover:scale-[1.02] active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2 text-sm font-extrabold text-black">
              <Check className="size-4 stroke-[3]" />
              <span>Tasks</span>
            </div>
            <div>
              <div className="num text-3xl font-extrabold leading-none text-black">
                {doneCount}/{taskList.length || 11}
              </div>
              <div className="text-[11px] font-semibold text-zinc-500 mt-1">
                555 points available
              </div>
            </div>
          </Link>

          {/* Dark Check-in Card with 7 Capsules */}
          <div className="flex flex-col justify-between h-[148px] rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-4 shadow-sm">
            <div>
              <div className="text-sm font-extrabold text-[var(--tx)]">Check-in</div>
              <div className="text-[11px] font-semibold text-[var(--mut)] mt-0.5">
                {currentDays} days. Longest: {longestStreak}
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isFilled = day <= currentDays;
                return (
                  <span
                    key={day}
                    className={`flex-1 h-full rounded-md transition-all ${
                      isFilled ? 'bg-[#A66BFF]' : 'bg-[var(--line)] opacity-30'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Account Summary Card — Matching Reference 1:1 */}
        <section aria-label="Account summary" className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[var(--tx)]">Account summary</h4>
            {onSelectActivity ? (
              <button
                type="button"
                onClick={onSelectActivity}
                className="text-xs font-bold text-[#C9A6FF] hover:underline cursor-pointer"
              >
                Details
              </button>
            ) : (
              <Link href="/app/portfolio?tab=activity" className="text-xs font-bold text-[#C9A6FF] hover:underline">
                Details
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-[18px] bg-[var(--s2)]">
              <div className="text-xs font-bold text-[var(--mut)]">OK Points</div>
              <div className="num text-2xl font-extrabold text-[var(--tx)] mt-1.5 leading-none">
                {formatPoints(points)}
              </div>
              <div className="text-[11px] font-bold text-[#2FBD8E] mt-2">+20 today</div>
            </div>
            <div className="p-3.5 rounded-[18px] bg-[var(--s2)]">
              <div className="text-xs font-bold text-[var(--mut)]">$OKN balance</div>
              <div className="num text-2xl font-extrabold text-[var(--mut)] mt-1.5 leading-none">
                {isConnected ? '693,333' : '—'}
              </div>
              <div className="text-[11px] font-bold text-[var(--mut)] mt-2">
                {isConnected ? (address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Connected') : 'Connect a wallet'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-bold">
            <span className="text-[var(--mut)]">Claimable after next commit</span>
            <span className="num font-extrabold text-[#C9A6FF]">{formatPoints(points)} pts</span>
          </div>
        </section>

        {/* Recent Activity Card */}
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[var(--tx)]">Recent activity</h4>
            {onSelectActivity ? (
              <button
                type="button"
                onClick={onSelectActivity}
                className="text-xs font-bold text-[#C9A6FF] hover:underline cursor-pointer"
              >
                See all
              </button>
            ) : (
              <Link href="/app/portfolio?tab=activity" className="text-xs font-bold text-[#C9A6FF] hover:underline">
                See all
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {[
              { title: 'Daily check-in', time: 'Today, Nov 2', pts: '+20 pts', status: 'Awaiting commit' },
              { title: 'Daily check-in', time: 'Yesterday, Nov 1', pts: '+20 pts', status: 'Awaiting commit' },
              { title: 'Daily check-in', time: 'Oct 31', pts: '+20 pts', status: 'Awaiting commit' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--line)]/50 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(47,189,142,0.14)] text-[#2FBD8E]">
                    <Check className="size-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--tx)]">{item.title}</div>
                    <div className="text-[11px] font-semibold text-[var(--mut)]">{item.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-xs font-bold text-[#2FBD8E]">{item.pts}</div>
                  <div className="text-[10px] font-bold text-[#FFD60A]">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claim journey shortcut card */}
        <Link
          href="/app/claim"
          className="flex items-center gap-3.5 h-[72px] px-4 rounded-[22px] border border-[var(--line)] bg-[var(--s1)] shadow-sm hover:scale-[1.01] active:scale-98 transition-all"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--s2)] text-[#C9A6FF]">
            <Download className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-[var(--tx)]">Claim journey</div>
            <div className="text-xs font-semibold text-[var(--mut)]">Step 2 of 3: Merkle commit</div>
          </div>
          <ChevronRight className="size-4 text-[var(--mut)]" />
        </Link>

        {/* Invite friends shortcut card */}
        <Link
          href="/app/referral"
          className="flex items-center gap-3.5 h-[72px] px-4 rounded-[22px] border border-[var(--line)] bg-[var(--s1)] shadow-sm hover:scale-[1.01] active:scale-98 transition-all"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--s2)] text-[#09B4FF]">
            <Users className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-[var(--tx)]">Invite friends</div>
            <div className="text-xs font-semibold text-[var(--mut)]">14 referrals so far</div>
          </div>
          <ChevronRight className="size-4 text-[var(--mut)]" />
        </Link>
      </div>
    </div>
  );
}
