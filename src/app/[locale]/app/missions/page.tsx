'use client';

/**
 * /app/missions — Phase 5 community mission progress for the current user.
 *
 * Active missions show a live progress bar ("42,313 / 100,000 users"), the
 * reward at stake, and whether the viewer is eligible. Achieved/distributed
 * missions show whether the viewer received the reward. A "your contribution"
 * line ties the collective goal back to the individual (the viewer's own
 * activity is part of the metric).
 */
import { useTranslations } from 'next-intl';
import { CheckCircle2, Target, Trophy, Users } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { ErrorState, ListSkeleton } from '@/components/dashboard/data-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMissions } from '@/lib/hooks/use-missions';
import type { CommunityMetric, MissionWithProgress } from '@okn/shared';
import { cn, formatPoints } from '@/lib/utils';

const METRIC_KEY: Record<CommunityMetric, 'metricMembers' | 'metricTelegram' | 'metricBnb' | 'metricOkn'> = {
  user_count: 'metricMembers',
  telegram_members: 'metricTelegram',
  total_bnb: 'metricBnb',
  total_okn_claimed: 'metricOkn',
};

export default function MissionsPage() {
  const t = useTranslations('dashboard.missions');
  const missions = useMissions();
  const list = missions.data?.missions ?? [];
  const active = list.filter((m) => m.status === 'active');
  const completed = list.filter((m) => m.status !== 'active');

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {missions.isLoading ? (
        <ListSkeleton rows={3} />
      ) : missions.isError ? (
        <ErrorState onRetry={() => void missions.refetch()} />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Target className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{t('emptyTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('emptyMessage')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active missions */}
          {active.length > 0 ? (
            <div className="space-y-4">
              {active.map((m) => (
                <ActiveMissionCard key={m.id} mission={m} />
              ))}
            </div>
          ) : null}

          {/* Completed missions */}
          {completed.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {t('completedHeading')}
              </h2>
              {completed.map((m) => (
                <CompletedMissionCard key={m.id} mission={m} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

function formatMetricValue(value: string, metric: CommunityMetric): string {
  const n = Number(value);
  if (metric === 'total_bnb') {
    return `${(n / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} BNB`;
  }
  if (metric === 'total_okn_claimed') {
    return `${(n / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} $OKN`;
  }
  return n.toLocaleString();
}

function formatThreshold(value: string, metric: CommunityMetric): string {
  const n = Number(value);
  if (metric === 'total_bnb') return `${(n / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} BNB`;
  if (metric === 'total_okn_claimed') return `${(n / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} $OKN`;
  return n.toLocaleString();
}

function ActiveMissionCard({ mission }: { mission: MissionWithProgress }) {
  const t = useTranslations('dashboard.missions');
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-ios-indigo" />
              {mission.title}
            </CardTitle>
            {mission.description ? (
              <CardDescription>{mission.description}</CardDescription>
            ) : null}
          </div>
          <Badge className="bg-ios-indigo/10 text-ios-indigo">{t('rewardLabel', { reward: formatPoints(mission.rewardPerUser) })}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t(METRIC_KEY[mission.metric])}</span>
            <span className="font-semibold tabular-nums">
              {formatMetricValue(mission.currentValue, mission.metric)}{' '}
              <span className="text-muted-foreground">/ {formatThreshold(mission.threshold, mission.metric)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ios-indigo to-ios-blue transition-all"
              style={{ width: `${mission.progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {mission.eligible ? t('eligible') : t('notEligible')}
        </div>
      </CardContent>
    </Card>
  );
}

function CompletedMissionCard({ mission }: { mission: MissionWithProgress }) {
  const t = useTranslations('dashboard.missions');
  const isAchieved = mission.status === 'achieved';
  return (
    <Card className={cn(mission.received && 'border-ios-green/40')}>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            mission.received ? 'bg-ios-green/10 text-ios-green' : 'bg-muted text-muted-foreground',
          )}
        >
          {mission.received ? <CheckCircle2 className="size-5" /> : <Trophy className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{mission.title}</p>
          <p className="text-xs text-muted-foreground">
            {isAchieved ? t('statusAchieved') : t('statusDistributed')}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {mission.received ? (
            <span className="text-sm font-semibold text-ios-green tabular-nums">
              {t('receivedPoints', { points: formatPoints(mission.rewardPerUser) })}
            </span>
          ) : mission.eligible ? (
            <span className="text-xs text-muted-foreground">{t('processing')}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t('joinedTooLate')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
