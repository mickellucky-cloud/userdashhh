'use client';

/**
 * components/dashboard/activity-view.tsx
 *
 * The "Activity" half of the merged Portfolio page. Surfaces the live
 * engagement view: KPI row (points / balance / tasks / referrals), the daily
 * check-in streak, claim + buy shortcuts, and the three most recent tasks.
 *
 * Extracted from the former /app (Overview) page so the same content can
 * render inside the Activity tab of /app/portfolio without duplication.
 */
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, Coins, Gift, ListChecks, ShoppingCart, Users, Zap } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { StreakWidget } from '@/components/dashboard/daily-check-in';
import { WarningBanner, ListSkeleton, StatGridSkeleton } from '@/components/dashboard/data-state';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useReferral } from '@/lib/hooks/use-referral';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useSalePrice } from '@/lib/hooks/use-sale';
import { formatPoints, formatWei } from '@/lib/utils';

export function ActivityView() {
  const t = useTranslations('dashboard.activity');
  const tCommon = useTranslations('dashboard.common');
  const eligibility = useClaimEligibility();
  const tasks = useTasks();
  const referral = useReferral();
  const balance = useOknBalance();
  const sale = useSalePrice();

  const points = eligibility.data?.points ?? 0;
  const isClaimOpen = eligibility.data?.latestRootVersion != null;
  const taskList = tasks.data ?? [];
  const doneCount = taskList.filter((t) => t.completionStatus != null).length;

  return (
    <div className="space-y-6">
      {/* KPI row — degrades to defaults with a soft warning on failure. */}
      {eligibility.isLoading || tasks.isLoading ? (
        <StatGridSkeleton />
      ) : (
        <>
          {(eligibility.isError || tasks.isError) && (
            <WarningBanner
              onRetry={() => {
                void eligibility.refetch();
                void tasks.refetch();
              }}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Gift}
              tint="indigo"
              label={t('pointsEarned')}
              value={formatPoints(points)}
              hint={t('pointsHint')}
            />
            <StatCard
              icon={Coins}
              tint="blue"
              label={t('balance')}
              value={balance.data != null ? formatWei(balance.data) : '—'}
              hint={t('balanceHint')}
            />
            <StatCard
              icon={ListChecks}
              tint="green"
              label={t('tasksDone')}
              value={`${doneCount} / ${taskList.length}`}
              hint={t('tasksDoneHint')}
            />
            <StatCard
              icon={Users}
              tint="orange"
              label={t('referrals')}
              value={formatPoints(referral.data?.count ?? 0)}
              hint={t('referralsHint', { count: formatPoints(referral.data?.pointsEarned ?? 0) })}
            />
          </div>
        </>
      )}

      {/* Daily login streak widget */}
      <StreakWidget />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left column: Claim + Buy */}
        <div className="space-y-6 lg:col-span-3">
          {/* Claim your $OKN Card with Merkle Stepper */}
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">{t('claimTitle')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--mut)] md:text-sm">
                  {t('claimDesc')}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                  isClaimOpen
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                }`}
              >
                {isClaimOpen ? 'Eligible' : 'Not open yet'}
              </span>
            </div>

            {/* Merkle Progress Stepper */}
            <div className="my-5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 md:p-5">
              <div className="relative flex items-center justify-between">
                {/* Step 1: Earn points */}
                <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#2FBD8E] text-xs font-extrabold text-white shadow-[0_0_10px_rgba(47,189,142,0.4)]">
                    <Check className="size-4 stroke-[3]" />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--tx)]">Earn points</span>
                </div>

                {/* Connector line 1 */}
                <div className="mx-2 -mt-4.5 h-[2px] flex-1 bg-[#2FBD8E]" />

                {/* Step 2: Merkle commit */}
                <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                      isClaimOpen
                        ? 'border-[#2FBD8E] bg-[#2FBD8E] text-white shadow-[0_0_10px_rgba(47,189,142,0.4)]'
                        : 'border-[#7A12F5] bg-[#7A12F5]/20 text-[#C9A6FF] shadow-[0_0_10px_rgba(122,18,245,0.3)]'
                    }`}
                  >
                    {isClaimOpen ? <Check className="size-4 stroke-[3]" /> : '2'}
                  </div>
                  <span className="text-[11px] font-bold text-[#C9A6FF]">Merkle commit</span>
                </div>

                {/* Connector line 2 */}
                <div
                  className={`mx-2 -mt-4.5 h-[2px] flex-1 ${
                    isClaimOpen ? 'bg-[#2FBD8E]' : 'bg-[var(--line)]'
                  }`}
                />

                {/* Step 3: Claim on-chain */}
                <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full border text-xs font-extrabold ${
                      isClaimOpen
                        ? 'border-[#7A12F5] bg-[#7A12F5] text-white shadow-[0_0_12px_rgba(122,18,245,0.4)]'
                        : 'border-[var(--line)] bg-[var(--s1)] text-[var(--mut)]'
                    }`}
                  >
                    3
                  </div>
                  <span className="text-[11px] font-bold text-[var(--mut)]">Claim on-chain</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[var(--mut)] uppercase">
                  {t('claimablePoints')}
                </p>
                <p className="num mt-0.5 text-3xl font-extrabold tracking-tight text-[var(--tx)]">
                  {formatPoints(points)}
                </p>
              </div>
              <Button
                asChild
                className="web3-btn h-11 rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] px-6 font-bold text-white shadow-[0_4px_16px_rgba(122,18,245,0.35)] hover:from-[#8C38F7] hover:to-[#7A12F5]"
              >
                <Link href="/app/claim">
                  {t('goToClaim')}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Buy $OKN Presale Card */}
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">{t('buyTitle')}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--mut)] md:text-sm">
                  {sale.data
                    ? t('buyDescRate', {
                        rate: formatWei(sale.data.rate),
                        paused: sale.data.isPaused ? t('buyDescPausedSuffix') : '',
                      })
                    : t('buyDescDefault')}
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-400">
                Presale Live
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[rgba(9,180,255,0.12)] text-[#09B4FF]">
                  <Coins className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-[var(--mut)] uppercase">Sale Rate</p>
                  <p className="num text-base font-extrabold text-[var(--tx)]">
                    {sale.data ? `1 BNB = ${formatWei(sale.data.rate)} $OKN` : '—'}
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="web3-btn h-11 rounded-xl border border-[var(--line)] bg-[var(--s2)] px-6 font-bold text-[var(--tx)] shadow-sm hover:border-[#7A12F5]/50 hover:bg-[var(--line)]"
              >
                <Link href="/app/buy">
                  <ShoppingCart className="mr-1.5 size-4 text-[#09B4FF]" />
                  {t('openSale')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: Recent Tasks & Community */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">{t('tasksTitle')}</h3>
                <p className="text-xs text-[var(--mut)]">{t('tasksDesc')}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-[#C9A6FF] hover:bg-[#7A12F5]/10">
                <Link href="/app/tasks">
                  {t('tasksSeeAll')}
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.isLoading ? (
                <ListSkeleton rows={3} />
              ) : tasks.isError ? (
                <WarningBanner onRetry={() => void tasks.refetch()} />
              ) : taskList.length === 0 ? (
                <p className="py-8 text-center text-sm font-medium text-[var(--mut)]">{t('noTasks')}</p>
              ) : (
                taskList.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)]/70 p-3.5 transition-all hover:border-[#7A12F5]/30 hover:bg-[var(--s2)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--tx)]">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-md bg-[#7A12F5]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#C9A6FF]">
                          {tCommon('plusPts', { count: task.rewardPoints })}
                        </span>
                      </div>
                    </div>
                    {task.completionStatus ? (
                      <StatusBadge status={task.completionStatus} />
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        className="h-8 rounded-lg bg-[var(--line)] px-3 text-xs font-bold text-[var(--tx)] hover:bg-[#7A12F5] hover:text-white"
                      >
                        <Link href="/app/tasks">{t('doButton')}</Link>
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick invite promo card */}
          <div className="relative overflow-hidden rounded-[20px] border border-[var(--line)] bg-gradient-to-br from-[#7A12F5]/15 via-[var(--s2)] to-[var(--s1)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_2px_10px_rgba(122,18,245,0.4)]">
                <Zap className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-[var(--tx)]">Invite Friends & Boost Points</h4>
                <p className="text-xs text-[var(--mut)]">Earn up to 20% on tier 1, 2, and 3 referral rewards.</p>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild className="web3-btn w-full rounded-xl bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-xs font-bold text-white shadow-sm">
                <Link href="/app/referral">
                  Share Referral Link
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
