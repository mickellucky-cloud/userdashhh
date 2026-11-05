'use client';

/**
 * components/dashboard/portfolio-view.tsx
 *
 * The "Portfolio" half of the merged Portfolio page. Aggregated view of the
 * user's $OKN position: portfolio value (holdings × sale rate), the
 * holdings/bought/claimed/earned stat grid, the earned-by-source breakdown,
 * and the 3-level referral downline.
 *
 * Extracted from the former /app/portfolio page so the same content can
 * render inside the Portfolio tab of /app/portfolio without duplication.
 */
import { useTranslations } from 'next-intl';
import {
  Activity,
  ArrowDownToLine,
  Coins,
  Gift,
  ListChecks,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { CopierBalanceStrip } from '@/components/polymarket-agent/copier-balance';
import { WarningBanner, StatGridSkeleton } from '@/components/dashboard/data-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { formatPoints, formatWei } from '@/lib/utils';

/** A row in the earned-by-source breakdown. */
const SOURCES: {
  key: 'task' | 'referral' | 'bonus' | 'admin';
  icon: LucideIcon;
  tint: string;
}[] = [
  { key: 'task', icon: ListChecks, tint: 'bg-ios-blue/10 text-ios-blue' },
  { key: 'referral', icon: Users, tint: 'bg-ios-indigo/10 text-ios-indigo' },
  { key: 'bonus', icon: Gift, tint: 'bg-ios-orange/10 text-ios-orange' },
  { key: 'admin', icon: Activity, tint: 'bg-ios-green/10 text-ios-green' },
];

export function PortfolioView() {
  const t = useTranslations('dashboard.portfolioView');
  const portfolio = usePortfolio();
  const balance = useOknBalance();

  // On-chain holdings is the source of truth (post-claim $OKN in the wallet).
  const holdingsWei = balance.data ? balance.data.toString() : '0';
  const holdingsLabel = balance.isLoading
    ? t('loading')
    : balance.isError
      ? t('connectWallet')
      : `${formatWei(holdingsWei)} $OKN`;

  // Portfolio value proxy = holdings ($OKN) x (1 / sale rate, BNB per $OKN).
  // saleRate is $OKN-wei per 1 BNB-wei. $OKN per BNB = formatWei(saleRate).
  // To keep the number meaningful we show holdings in $OKN and rate in $OKN/BNB
  // separately, plus a combined "value" in BNB using the inverse rate.
  const rate = portfolio.data?.saleRate ?? '0';
  const ratePerBnb = formatWei(rate); // $OKN per BNB
  let valueBnbLabel = '—';
  if (rate !== '0' && balance.data) {
    try {
      const holdingsOkn = Number(balance.data) / 1e18;
      const rateOknPerBnb = Number(rate) / 1e18;
      if (rateOknPerBnb > 0) {
        const v = holdingsOkn / rateOknPerBnb;
        valueBnbLabel = `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB`;
      }
    } catch {
      // ignore parse errors; keep the dash
    }
  }

  const sourceLabels: Record<'task' | 'referral' | 'bonus' | 'admin', string> = {
    task: t('sourceTask'),
    referral: t('sourceReferral'),
    bonus: t('sourceBonus'),
    admin: t('sourceAdmin'),
  };
  const totalPtsLabel = (count: string) => t('totalPts', { count });
  const sourcePtsLabel = (count: string, pct: number) => t('sourcePts', { count, pct });

  return (
    <div className="space-y-6">
      {/* 3D Web3 Hero — portfolio value */}
      <div className="web3-hero p-6 md:p-8">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-white/90 backdrop-blur-md">
              <Activity className="size-3.5" />
              {t('portfolioValue')}
            </span>
            <p className="num mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {balance.isLoading || portfolio.isLoading ? t('loading') : valueBnbLabel}
            </p>
            <p className="mt-2 text-xs font-semibold text-white/80 md:text-sm">
              {t('valueNote', { rate: ratePerBnb })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md">
              Holdings: {holdingsLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Polymarket copier wallet balance (hidden when service unconfigured) */}
      <CopierBalanceStrip />

      {/* Stat grid */}
      {portfolio.isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <>
          {portfolio.isError ? <WarningBanner onRetry={() => void portfolio.refetch()} /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Wallet}
              tint="indigo"
              label={t('holdings')}
              value={holdingsLabel}
              hint={t('holdingsHint')}
            />
            <StatCard
              icon={ShoppingCart}
              tint="blue"
              label={t('totalBought')}
              value={`${formatWei(portfolio.data?.totalBought)} $OKN`}
              hint={t('totalBoughtHint')}
            />
            <StatCard
              icon={ArrowDownToLine}
              tint="green"
              label={t('totalClaimed')}
              value={`${formatWei(portfolio.data?.totalClaimed)} $OKN`}
              hint={t('totalClaimedHint')}
            />
            <StatCard
              icon={Coins}
              tint="orange"
              label={t('totalEarned')}
              value={formatPoints(portfolio.data?.totalEarned ?? 0)}
              hint={t('totalEarnedHint')}
            />
          </div>
        </>
      )}

      {/* Referral levels + earned-by-source */}
      {portfolio.isLoading ? null : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Earned by source */}
          <div className="web3-card p-6">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="text-lg font-extrabold text-[var(--tx)]">{t('pointsBySource')}</h3>
              <p className="text-xs text-[var(--mut)]">{t('pointsBySourceDesc')}</p>
            </div>
            <div className="mt-4 space-y-4">
              <SourceBars
                earnedBySource={portfolio.data?.earnedBySource}
                totalEarned={portfolio.data?.totalEarned ?? 0}
                sourceLabels={sourceLabels}
                renderSourcePts={sourcePtsLabel}
                renderTotalPts={totalPtsLabel}
              />
            </div>
          </div>

          {/* Referral levels */}
          <div className="web3-card p-6">
            <div className="border-b border-[var(--line)] pb-4">
              <h3 className="text-lg font-extrabold text-[var(--tx)]">{t('referralDownline')}</h3>
              <p className="text-xs text-[var(--mut)]">{t('referralDownlineDesc')}</p>
            </div>
            <div className="mt-5">
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <LevelStat
                  icon={Users}
                  label={t('level1')}
                  value={portfolio.data?.referralLevels.l1 ?? 0}
                  level="Tier 1 (10%)"
                />
                <LevelStat
                  icon={Users}
                  label={t('level2')}
                  value={portfolio.data?.referralLevels.l2 ?? 0}
                  level="Tier 2 (6%)"
                />
                <LevelStat
                  icon={Users}
                  label={t('level3')}
                  value={portfolio.data?.referralLevels.l3 ?? 0}
                  level="Tier 3 (4%)"
                />
              </div>
              <p className="mt-5 text-xs font-medium text-[var(--mut)]">{t('downlineNote')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Horizontal bar breakdown of points by source. */
function SourceBars({
  earnedBySource,
  totalEarned,
  sourceLabels,
  renderSourcePts,
  renderTotalPts,
}: {
  earnedBySource?: { task: number; referral: number; bonus: number; admin: number };
  totalEarned: number;
  sourceLabels: Record<'task' | 'referral' | 'bonus' | 'admin', string>;
  renderSourcePts: (count: string, pct: number) => string;
  renderTotalPts: (count: string) => string;
}) {
  const src = earnedBySource ?? { task: 0, referral: 0, bonus: 0, admin: 0 };
  const BAR_COLORS: Record<'task' | 'referral' | 'bonus' | 'admin', string> = {
    task: 'bg-[#09B4FF]',
    referral: 'bg-[#7A12F5]',
    bonus: 'bg-[#FFAA00]',
    admin: 'bg-[#2FBD8E]',
  };

  return (
    <>
      {SOURCES.map((s) => {
        const value = src[s.key] ?? 0;
        const pct = totalEarned > 0 ? Math.round((value / totalEarned) * 100) : 0;
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`flex size-6 items-center justify-center rounded-md ${s.tint}`}>
                  <s.icon className="size-3.5" />
                </span>
                <span className="font-semibold text-[var(--tx)]">{sourceLabels[s.key]}</span>
              </span>
              <span className="num text-xs font-bold text-[var(--mut)]">
                {renderSourcePts(formatPoints(value), pct)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--s2)] border border-[var(--line)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[s.key]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-xs font-semibold text-[var(--mut)]">
        {renderTotalPts(formatPoints(totalEarned))}
      </p>
    </>
  );
}

function LevelStat({
  icon: Icon,
  label,
  value,
  level,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  level?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 text-center transition-all hover:border-[#7A12F5]/30">
      <Icon className="size-5 text-[#C9A6FF]" />
      <p className="num mt-2 text-2xl font-extrabold tracking-tight text-[var(--tx)]">{formatPoints(value)}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--tx)]">{label}</p>
      {level && (
        <span className="mt-1 rounded-md bg-[#7A12F5]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#C9A6FF]">
          {level}
        </span>
      )}
    </div>
  );
}
