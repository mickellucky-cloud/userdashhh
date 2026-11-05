'use client';

/**
 * /app/staking — Coming soon.
 *
 * Planned: lock $OKN for 30/90/180/365 days and earn APY. Reduces selling
 * pressure and rewards long-term holders. Not implemented yet.
 */
import { CalendarClock, Lock, Percent, TrendingDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ComingSoonPage } from '@/components/dashboard/coming-soon-page';

export default function StakingPage() {
  const t = useTranslations('dashboard.staking');
  const tComingSoon = useTranslations('dashboard.comingSoon');
  const icons = [Lock, Percent, TrendingDown, CalendarClock];
  return (
    <ComingSoonPage
      title={t('title')}
      description={t('description')}
      icon={Lock}
      tagline={t('tagline')}
      features={t.raw('features').map((f: { title: string; description: string }, i: number) => ({
        icon: icons[i] ?? Lock,
        title: f.title,
        description: f.description,
      }))}
      badgeLabel={tComingSoon('badge')}
      body={tComingSoon('body')}
      footerNote={tComingSoon('footerNote')}
    />
  );
}
