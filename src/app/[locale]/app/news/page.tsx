'use client';

/**
 * /app/news — Coming soon.
 *
 * Planned: a feed of the latest announcements, listings, partnerships, roadmap
 * updates, and new features. Not implemented yet.
 */
import { Gift, Megaphone, Milestone, Newspaper, Plug, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ComingSoonPage } from '@/components/dashboard/coming-soon-page';

export default function NewsPage() {
  const t = useTranslations('dashboard.news');
  const tComingSoon = useTranslations('dashboard.comingSoon');
  const icons = [Megaphone, Plug, Gift, Milestone, Rocket, Newspaper];
  return (
    <ComingSoonPage
      title={t('title')}
      description={t('description')}
      icon={Newspaper}
      tagline={t('tagline')}
      features={t.raw('features').map((f: { title: string; description: string }, i: number) => ({
        icon: icons[i] ?? Newspaper,
        title: f.title,
        description: f.description,
      }))}
      badgeLabel={tComingSoon('badge')}
      body={tComingSoon('body')}
      footerNote={tComingSoon('footerNote')}
    />
  );
}
