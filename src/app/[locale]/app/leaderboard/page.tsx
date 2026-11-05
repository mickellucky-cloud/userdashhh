'use client';

/**
 * /app/leaderboard — Phase 4. Live rankings across 3 categories x 3 periods.
 *
 * Top-3 podium + a ranked list, with a "your rank" footer so the viewer always
 * sees where they stand even if outside the visible top-N. Period and category
 * are tabs; switching refetches. Past winners are linked from the page header.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Crown, ListChecks, ShoppingCart, Trophy, Users } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { ErrorState, ListSkeleton } from '@/components/dashboard/data-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';
import type { LeaderboardCategory, LeaderboardEntry, LeaderboardPeriod } from '@okn/shared';
import { cn, formatPoints } from '@/lib/utils';

const CATEGORIES: { key: LeaderboardCategory; labelKey: 'catReferrers' | 'catTasks' | 'catBuyers'; unitKey: 'unitRefs' | 'unitPts' | 'unitBnb'; icon: typeof Users }[] = [
  { key: 'referrals', labelKey: 'catReferrers', unitKey: 'unitRefs', icon: Users },
  { key: 'tasks', labelKey: 'catTasks', unitKey: 'unitPts', icon: ListChecks },
  { key: 'buyers', labelKey: 'catBuyers', unitKey: 'unitBnb', icon: ShoppingCart },
];

const PERIODS: { key: LeaderboardPeriod; labelKey: 'periodWeek' | 'periodMonth' | 'periodAll' }[] = [
  { key: 'weekly', labelKey: 'periodWeek' },
  { key: 'monthly', labelKey: 'periodMonth' },
  { key: 'all_time', labelKey: 'periodAll' },
];

export default function LeaderboardPage() {
  const t = useTranslations('dashboard.leaderboard');
  const [category, setCategory] = useState<LeaderboardCategory>('referrals');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const lb = useLeaderboard(category, period);
  const meta = CATEGORIES.find((c) => c.key === category)!;

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link
            href="/app/leaderboard/winners"
            className="text-sm text-ios-blue transition-colors hover:underline"
          >
            {t('pastWinners')}
          </Link>
        }
      />

      {/* Category tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
        <TabsList>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              <c.icon data-icon="inline-start" className="size-4" />
              {t(c.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Period tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
        <TabsList>
          {PERIODS.map((p) => (
            <TabsTrigger key={p.key} value={p.key}>
              {t(p.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {lb.isLoading ? (
        <ListSkeleton rows={8} />
      ) : lb.isError ? (
        <ErrorState onRetry={() => void lb.refetch()} />
      ) : lb.data && lb.data.entries.length > 0 ? (
        <>
          {/* Top-3 podium */}
          <div className="grid grid-cols-3 gap-3">
            <PodiumCard entry={lb.data.entries[1]} place={2} unit={t(meta.unitKey)} />
            <PodiumCard entry={lb.data.entries[0]} place={1} unit={t(meta.unitKey)} />
            <PodiumCard entry={lb.data.entries[2]} place={3} unit={t(meta.unitKey)} />
          </div>

          {/* Ranked list (4+) */}
          {lb.data.entries.length > 3 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('fullRankingTitle')}</CardTitle>
                <CardDescription>
                  {period === 'all_time'
                    ? t('fullRankingAllTime', { category: t(meta.labelKey).toLowerCase() })
                    : period === 'weekly'
                      ? t('fullRankingWeek', { category: t(meta.labelKey).toLowerCase() })
                      : t('fullRankingMonth', { category: t(meta.labelKey).toLowerCase() })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/60">
                  {lb.data.entries.slice(3).map((e) => (
                    <div
                      key={e.userId}
                      className={cn(
                        'flex items-center gap-3 py-3 first:pt-0 last:pb-0',
                        e.isMe && 'rounded-lg bg-ios-blue/5 px-2',
                      )}
                    >
                      <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                        {e.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {e.firstName ?? e.username ?? t('anonymous')}
                        {e.isMe ? <span className="ml-1 text-xs text-ios-blue">{t('youSuffix')}</span> : null}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatScore(e.score, t(meta.unitKey))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Your rank footer */}
          <YourRankFooter
            entry={lb.data.myRank}
            unit={t(meta.unitKey)}
            empty={lb.data.entries.length === 0}
          />
        </>
      ) : (
        // No entries yet
        <Card>
          <CardContent className="py-10 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{t('noEntriesTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {period === 'all_time' ? t('noEntriesAllTime') : t('noEntriesDefault')}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

/** Format a score string with its unit. score is numeric-as-string from the wire. */
function formatScore(score: string, unit: string): string {
  // Buyers score is BNB wei -> format to a readable BNB number; others are small ints.
  if (unit === 'BNB') {
    try {
      const bnb = Number(score) / 1e18;
      return `${bnb.toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB`;
    } catch {
      return `${score} BNB`;
    }
  }
  return `${formatPoints(Number(score) || 0)} ${unit}`;
}

function PodiumCard({
  entry,
  place,
  unit,
}: {
  entry?: { userId: string; firstName: string | null; username: string | null; score: string; isMe: boolean };
  place: 1 | 2 | 3;
  unit: string;
}) {
  const t = useTranslations('dashboard.leaderboard');
  if (!entry) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--s1)]/50 p-4 text-center">
        <span className="text-xs text-[var(--mut)]">—</span>
      </div>
    );
  }
  const isFirst = place === 1;
  const tint =
    place === 1
      ? 'bg-[rgba(255,170,0,0.18)] text-[#FFAA00] shadow-[0_0_15px_rgba(255,170,0,0.3)]'
      : place === 2
        ? 'bg-[rgba(9,180,255,0.15)] text-[#09B4FF] shadow-[0_0_15px_rgba(9,180,255,0.25)]'
        : 'bg-[rgba(122,18,245,0.15)] text-[#C9A6FF] shadow-[0_0_15px_rgba(122,18,245,0.25)]';
  const sizeCls = isFirst ? 'order-2 -mt-3' : place === 2 ? 'order-1' : 'order-3';

  return (
    <div
      className={cn(
        'web3-card flex flex-col items-center justify-center p-4 text-center transition-all',
        isFirst && 'border-[#FFAA00]/40 bg-gradient-to-b from-[#FFAA00]/10 via-[var(--s1)] to-[var(--s1)]',
        sizeCls,
      )}
    >
      <span className={cn('mx-auto flex size-10 items-center justify-center rounded-full', tint)}>
        {isFirst ? <Crown className="size-5" /> : <span className="num text-sm font-extrabold">{place}</span>}
      </span>
      <p className="mt-2.5 max-w-[120px] truncate text-sm font-bold text-[var(--tx)]">
        {entry.firstName ?? entry.username ?? t('anonymous')}
      </p>
      <p className="num mt-0.5 text-xs font-bold text-[var(--mut)]">{formatScore(entry.score, unit)}</p>
    </div>
  );
}

function YourRankFooter({
  entry,
  unit,
  empty,
}: {
  entry: LeaderboardEntry | null;
  unit: string;
  empty: boolean;
}) {
  const t = useTranslations('dashboard.leaderboard');
  if (!entry) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        {empty ? t('yourRankEmpty') : t('yourRankNotRanked')}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-ios-blue/30 bg-ios-blue/5 p-4">
      <div className="flex items-center gap-3">
        <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-ios-blue">
          {entry.rank}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {entry.firstName ?? entry.username ?? t('anonymous')}{' '}
          <span className="text-xs text-ios-blue">{t('youSuffix')}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatScore(entry.score, unit)}
        </span>
      </div>
    </div>
  );
}
