'use client';

/**
 * /app/learn — Coming soon.
 *
 * Planned: short blockchain and crypto lessons. Complete a lesson, pass the
 * quiz, earn OKN. Not implemented yet.
 */
import { BookOpen, Brain, GraduationCap, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ComingSoonPage } from '@/components/dashboard/coming-soon-page';

export default function LearnPage() {
  const t = useTranslations('dashboard.learn');
  const tComingSoon = useTranslations('dashboard.comingSoon');
  const icons = [BookOpen, Brain, Wallet, GraduationCap];
  return (
    <ComingSoonPage
      title={t('title')}
      description={t('description')}
      icon={GraduationCap}
      tagline={t('tagline')}
      features={t.raw('features').map((f: { title: string; description: string }, i: number) => ({
        icon: icons[i] ?? BookOpen,
        title: f.title,
        description: f.description,
      }))}
      badgeLabel={tComingSoon('badge')}
      body={tComingSoon('body')}
      footerNote={tComingSoon('footerNote')}
    />
  );
}
