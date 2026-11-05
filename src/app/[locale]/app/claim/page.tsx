'use client';

/**
 * /app/claim — convert OK Points into on-chain $OKN via the Merkle distributor.
 *
 * Growth-engine redesign: the page leads with a celebratory hero banner
 * showing the user's earned OK Points, then presents a clear state — ready to
 * claim (committed root, entitlement > 0) or pending commit (points earned but
 * not yet in a root). The points -> OKN relationship is made explicit so users
 * understand what they are claiming.
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CircleDollarSign, GitCommitHorizontal, ListChecks, PartyPopper } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { ErrorState } from '@/components/dashboard/data-state';
import { ClaimButton } from '@/components/dashboard/claim-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { formatPoints } from '@/lib/utils';

export default function ClaimPage() {
  const t = useTranslations('dashboard.claim');
  const eligibility = useClaimEligibility();
  const points = eligibility.data?.points ?? 0;
  const hasCommittedRoot = eligibility.data?.latestRootVersion != null;

  return (
    <main className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {/* Celebratory Web3 hero banner: the user's earned OK Points. */}
      <div className="web3-hero p-8 text-center">
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <PartyPopper className="size-7" />
          </span>
          {eligibility.isLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="mx-auto h-4 w-28 bg-white/20" />
              <Skeleton className="mx-auto h-12 w-48 bg-white/20" />
            </div>
          ) : eligibility.isError ? (
            <ErrorState onRetry={() => void eligibility.refetch()} />
          ) : (
            <>
              <p className="text-xs font-bold tracking-wider text-white/80 uppercase">
                {t('earnedBanner')}
              </p>
              <p className="num text-5xl font-extrabold tracking-tight text-white md:text-6xl">
                {formatPoints(points)}
              </p>
              <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-extrabold text-white backdrop-blur-xs">
                {t('earnedUnit')}
              </span>
              {points === 0 ? (
                <p className="mt-2 max-w-sm text-sm text-white/80">
                  {t('noPointsMessage')}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Empty state: no points — send the user to earn. */}
      {!eligibility.isLoading && !eligibility.isError && points === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="size-4 text-ios-blue" />
              {t('noPointsTitle')}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/tasks">{t('goToTasks')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* State callout + claim flow */}
        <ClaimButton />

        {/* Status / notes card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pointsTitle')}</CardTitle>
            <CardDescription>{t('pointsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('claimablePoints')}
              </p>
              <p className="font-display text-3xl font-bold tabular-nums">
                {formatPoints(points)}
              </p>
            </div>

            {/* Pending-commit notice: points exist but no root committed yet. */}
            {points > 0 && !hasCommittedRoot ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-muted/40 p-3">
                <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-ios-indigo" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t('pendingTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('pendingBody')}</p>
                </div>
              </div>
            ) : null}

            <ul className="space-y-2.5 border-t border-border/60 pt-4">
              <NoteRow icon={GitCommitHorizontal} tint="text-ios-indigo">
                {t('noteMerkle')}
              </NoteRow>
              <NoteRow icon={CircleDollarSign} tint="text-ios-green">
                {t('noteFee')}
              </NoteRow>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>{t('howTitle')}</CardTitle>
          <CardDescription>{t('howDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Step n={1} title={t('step1Title')} text={t('step1Text')} />
          <Step n={2} title={t('step2Title')} text={t('step2Text')} />
          <Step n={3} title={t('step3Title')} text={t('step3Text')} />
        </CardContent>
      </Card>
    </main>
  );
}

function NoteRow({
  icon: Icon,
  tint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className={`mt-0.5 size-4 shrink-0 ${tint}`} />
      <span className="text-sm text-muted-foreground">{children}</span>
    </li>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ios-blue/10 text-xs font-bold text-ios-blue tabular-nums">
        {n}
      </span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
