'use client';

/**
 * /app/leaderboard/winners — Phase 4 past leaderboard winners (snapshots).
 *
 * Grouped by period_key, then category. Shows the rank, winner, score, and the
 * bonus points they received. Filterable by period (weekly / monthly).
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { ErrorState, ListSkeleton } from '@/components/dashboard/data-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeaderboardWinners } from '@/lib/hooks/use-leaderboard';
import type { LeaderboardCategory, LeaderboardPeriod, LeaderboardWinner } from '@okn/shared';
import { formatPoints } from '@/lib/utils';

const CATEGORY_KEY: Record<LeaderboardCategory, 'catReferrers' | 'catTasks' | 'catBuyers'> = {
  referrals: 'catReferrers',
  tasks: 'catTasks',
  buyers: 'catBuyers',
};

const PERIOD_KEY: Record<LeaderboardPeriod, 'periodWeek' | 'periodMonth' | 'periodAll'> = {
  weekly: 'periodWeek',
  monthly: 'periodMonth',
  all_time: 'periodAll',
};

export default function WinnersPage() {
  const t = useTranslations('dashboard.winners');
  const tc = useTranslations('dashboard.common');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const winners = useLeaderboardWinners({ period });

  // Group winners by periodKey, then category. The API returns { winners: [...] }.
  const groups = groupWinners(winners.data?.winners ?? []);

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link href="/app/leaderboard" className="inline-flex items-center gap-1 text-sm text-ios-blue hover:underline">
            <ArrowLeft className="size-4" />
            {t('backToLeaderboard')}
          </Link>
        }
      />

      <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
        <TabsList>
          <TabsTrigger value="weekly">{t('tabWeekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('tabMonthly')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {winners.isLoading ? (
        <ListSkeleton rows={5} />
      ) : winners.isError ? (
        <ErrorState onRetry={() => void winners.refetch()} />
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{t('emptyTitle', { period: t(PERIOD_KEY[period]) })}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('emptyMessage', { periodWord: period === 'weekly' ? t('periodWordWeek') : t('periodWordMonth') })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={`${g.periodKey}-${g.category}`}>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('groupTitle', {
                    period: t(PERIOD_KEY[g.period]),
                    key: g.periodKey,
                    category: t(CATEGORY_KEY[g.category]),
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/60">
                  {g.winners.map((w) => (
                    <div key={w.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ios-orange/10 text-xs font-bold text-ios-orange">
                        {w.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {w.firstName ?? w.username ?? tc('anonymous')}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {t('scoreLabel')} {formatScore(w)}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-ios-green tabular-nums">
                        {t('pointsAwarded', { points: formatPoints(w.pointsAwarded) })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function formatScore(w: LeaderboardWinner): string {
  if (w.category === 'buyers') {
    try {
      return `${(Number(w.score) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB`;
    } catch {
      return w.score;
    }
  }
  return formatPoints(Number(w.score) || 0);
}

function groupWinners(winners: LeaderboardWinner[]) {
  // Group by (periodKey, category), preserving the order they arrived in
  // (newest snapshot first from the API).
  const map = new Map<string, { period: LeaderboardPeriod; periodKey: string; category: LeaderboardCategory; winners: LeaderboardWinner[] }>();
  for (const w of winners) {
    const key = `${w.periodKey}-${w.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.winners.push(w);
    } else {
      map.set(key, { period: w.period, periodKey: w.periodKey, category: w.category, winners: [w] });
    }
  }
  return Array.from(map.values());
}
