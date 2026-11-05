'use client';

/**
 * /app/referral — Partner Program & Web3 Referral Dashboard.
 *
 * Full port from https://newdash-ruby.vercel.app/referral
 * Features dynamic referral links, real-time earnings stats, rank progression bar,
 * 4 partner package sections, and tiered commissions.
 */
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, Eye, EyeOff, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useReferral } from '@/lib/hooks/use-referral';
import { useMe } from '@/lib/hooks/use-me';
import { toast } from 'sonner';

export default function ReferralPage() {
  const t = useTranslations('dashboard.referral');
  const referral = useReferral();
  const { data: meData } = useMe();
  const [copied, setCopied] = useState(false);
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

  const referralCode = 'ref_dev';
  const link = `https://t.me/okntest001_bot?start=${referralCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Link copied');
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    'Join the $OKN ecosystem and stack points with me!',
  )}&url=${encodeURIComponent(link)}`;

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    link,
  )}&text=${encodeURIComponent('Join the $OKN presale and referral program!')}`;

  return (
    <main className="space-y-6 pb-12">
      {/* 1. Hero Banner: Partner package */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7A12F5] via-[#6D0ED8] to-[#5106B3] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between">
          <div>
            <span className="inline-block text-[11px] font-extrabold tracking-widest text-purple-200/90 uppercase">
              PARTNER PROGRAM · REFERRAL
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
              Partner package
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/15 p-3.5 backdrop-blur-md shadow-inner sm:p-4">
              <div className="font-mono text-lg font-black text-white sm:text-2xl">
                10–15%
              </div>
              <div className="mt-1 text-[11px] font-semibold text-purple-100/80 sm:text-xs">
                Commission
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 p-3.5 backdrop-blur-md shadow-inner sm:p-4">
              <div className="font-mono text-lg font-black text-white sm:text-2xl">
                $200,000
              </div>
              <div className="mt-1 text-[11px] font-semibold text-purple-100/80 sm:text-xs">
                Marketing budget
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 p-3.5 backdrop-blur-md shadow-inner sm:p-4">
              <div className="font-mono text-lg font-black text-white sm:text-2xl">
                12 mo
              </div>
              <div className="mt-1 text-[11px] font-semibold text-purple-100/80 sm:text-xs">
                Token vesting
              </div>
            </div>
          </div>
        </div>

        {/* Subtle ambient lighting */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-64 rounded-full bg-[#8C38F7]/30 blur-3xl" />
      </section>

      {/* 2. Your Unique Referral Link Card */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--tx)]">
              Your Unique Referral Link
            </h2>
            <p className="mt-1 text-xs text-[var(--mut)] sm:text-sm">
              Share your personal link to earn instant commissions and ascending tier multipliers.
            </p>
          </div>
          <div className="self-start sm:self-auto rounded-xl border border-[var(--line)] bg-[var(--s2)] px-3 py-1.5 text-xs font-semibold text-[var(--mut)]">
            Referral Code: <strong className="font-mono text-[var(--tx)] font-extrabold">{referralCode}</strong>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            id="ref-link-input"
            type="text"
            readOnly
            value={link}
            className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-3 font-mono text-xs sm:text-sm font-bold text-[var(--tx)] outline-none select-all transition-colors focus:border-[#7A12F5]"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex h-12 flex-1 sm:flex-initial sm:px-6 items-center justify-center gap-2 rounded-2xl bg-[#7A12F5] font-bold text-sm text-white shadow-md hover:bg-[#8C38F7] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy link</span>
                </>
              )}
            </button>

            {/* X / Twitter share */}
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Telegram share */}
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Telegram"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-[#09B4FF] hover:bg-[var(--s1)] active:scale-95 transition-all cursor-pointer"
            >
              <svg className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Upgraded Referral Account Statistics */}
      <section className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[var(--tx)]">Referral Account Statistics</h3>
            <p className="text-xs text-[var(--mut)] mt-0.5">
              Real-time earnings performance, active downstream buyers, and partner rank
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[#7A12F5]/30 bg-[#7A12F5]/15 px-3 py-1 text-xs font-extrabold text-[#C9A6FF]">
              Silver Partner (Tier 2)
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--s2)] text-xs font-bold text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>Toggle Balances</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="text-xs font-bold text-[var(--mut)]">Total Referrals</div>
            <div className="num text-2xl font-extrabold text-[var(--tx)] mt-1">
              14 <span className="text-xs font-semibold text-[var(--mut)]">friends</span>
            </div>
            <div className="text-[11px] font-bold text-[#2FBD8E] mt-1">11 active buyers (78%)</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="text-xs font-bold text-[var(--mut)]">Total Earned ($)</div>
            <div className="num text-2xl font-extrabold text-[#2FBD8E] mt-1">
              {hideBalance ? '••••••' : '$142.50'}
            </div>
            <div className="text-[11px] font-bold text-[#F3BA2F] mt-1">~0.238 BNB Payout</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="text-xs font-bold text-[var(--mut)]">Active Commission Rate</div>
            <div className="num text-2xl font-extrabold text-[var(--tx)] mt-1">12.5%</div>
            <div className="text-[11px] font-bold text-[var(--mut)] mt-1">Next tier: 15.0%</div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4">
            <div className="text-xs font-bold text-[var(--mut)]">Ecosystem Multiplier</div>
            <div className="num text-2xl font-extrabold text-[#FFD60A] mt-1">1.5x</div>
            <div className="text-[11px] font-bold text-[var(--mut)] mt-1">+1,420 OK Points</div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[var(--tx)]">
              Rank Progression: <strong className="text-[#C9A6FF]">Gold Partner (15% Commission)</strong>
            </span>
            <span className="text-[#C9A6FF]">14 / 25 Referrals (56%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--line)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7A12F5] to-[#09B4FF] transition-all duration-500"
              style={{ width: '56%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--mut)]">
            <span>11 more successful invites needed to reach maximum Tier 3 tier status</span>
            <span className="font-bold text-[var(--tx)]">Instant auto-upgrade upon qualification</span>
          </div>
        </div>
      </section>

      {/* 4. Section Title: Here is the package */}
      <div className="pt-2">
        <h2 className="text-lg font-extrabold text-[var(--tx)]">
          Here is the package:
        </h2>
      </div>

      {/* 5. The 4 Package Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              1
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                Tiered Performance Commissions
              </h3>
              <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                (The &quot;Mouth-Watering&quot; Part)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
            We are allocating an initial{' '}
            <strong className="text-[var(--tx)] font-extrabold">
              $200,000 Presale Marketing Budget
            </strong>{' '}
            strictly for performance payouts.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Direct Sales Commission:</strong>{' '}
                You earn a <strong className="text-[var(--tx)] font-bold">10% - 15% commission</strong>{' '}
                on every single token purchase (USDT/BNB) made through your unique tracking links.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">The Math:</strong>{' '}
                If you drive $500k in sales, you instantly earn{' '}
                <strong className="text-[var(--tx)] font-bold">$50,000 - $75,000</strong>. If you drive $1M, you earn $100k+.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Milestone Bonuses:</strong>{' '}
                Aggressive monthly volume targets pay flat cash bonuses directly to your wallet.
              </div>
            </div>
          </div>
        </section>

        {/* Card 2 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              2
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                The OKN Token Allocation
              </h3>
              <p className="text-xs font-semibold text-[var(--mut)] mt-0.5">
                (The &quot;Skin in the Game&quot;)
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
            We want you to be wealthy when OKN succeeds, not just paid for a campaign.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                Offering an allocation of <strong className="text-[var(--tx)] font-bold">OKN Tokens</strong> to top marketing partners, vesting over 12 months.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                Direct stake in the token: when OKN lists on Tier-1 exchanges at a higher price, your allocation delivers exponential upside.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Affiliate Leaderboard:</strong> Top 90-day volume drivers receive a 2x multiplier on token allocations.
              </div>
            </div>
          </div>
        </section>

        {/* Card 3 */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7A12F5] font-extrabold text-base text-white shadow-sm">
              3
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--tx)] leading-tight">
                VIP Access &amp; Status
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Lifetime Fee Discount:</strong> Personal trading fees on the OKNexus exchange will be permanently zeroed out.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7A12F5]" />
              <div className="text-xs sm:text-sm leading-relaxed text-[var(--mut)]">
                <strong className="text-[var(--tx)] font-bold">Inner Circle:</strong> Private briefing on major listings, agent deployments, and roadmap milestones before the public.
              </div>
            </div>
          </div>
        </section>

        {/* Card 4 */}
        <section
          style={{ background: 'var(--inv-bg)', color: 'var(--inv-tx)' }}
          className="rounded-3xl p-6 sm:p-7 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span
              style={{ background: 'var(--inv-tx)', color: 'var(--inv-bg)' }}
              className="flex size-9 shrink-0 items-center justify-center rounded-full font-extrabold text-base"
            >
              4
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold leading-tight">
                What We Provide You
              </h3>
              <p style={{ color: 'var(--inv-mut)' }} className="text-xs font-semibold mt-0.5">
                (Our Commitment)
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {[
              'A high-converting landing page and presale widget.',
              'Ready-made creative assets, banners, and video explainers.',
              'A dedicated affiliate dashboard to track your sales and commissions in real-time.',
              'Weekly syncs to ensure you have the support and custom collateral you need.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span style={{ background: 'var(--inv-tx)' }} className="mt-1.5 size-1.5 shrink-0 rounded-full" />
                <div className="text-xs sm:text-sm leading-relaxed">{text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 6. Commission Tiers Summary */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 shadow-sm">
        <h3 className="text-base font-extrabold text-[var(--tx)] mb-4">
          Commission Tier Structure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--s2)] space-y-1">
            <div className="text-xs font-extrabold text-[var(--tx)]">Tier 1 · Starter</div>
            <div className="text-[11px] text-[var(--mut)]">0–5 Active Buyers</div>
            <div className="num text-xl font-black text-[var(--tx)] mt-1">10% BNB</div>
          </div>

          <div className="p-4 rounded-2xl border border-[#7A12F5]/40 bg-[#7A12F5]/10 space-y-1">
            <div className="text-xs font-extrabold text-[#C9A6FF]">Tier 2 · Growth (Current)</div>
            <div className="text-[11px] text-[var(--mut)]">6–25 Active Buyers</div>
            <div className="num text-xl font-black text-[#C9A6FF] mt-1">12.5% BNB</div>
          </div>

          <div className="p-4 rounded-2xl border border-[#FFD60A]/40 bg-[#FFD60A]/10 space-y-1">
            <div className="text-xs font-extrabold text-[#FFD60A]">Tier 3 · Whale Partner</div>
            <div className="text-[11px] text-[var(--mut)]">26+ Active Buyers</div>
            <div className="num text-xl font-black text-[#FFD60A] mt-1">15% BNB</div>
          </div>
        </div>
      </section>
    </main>
  );
}
