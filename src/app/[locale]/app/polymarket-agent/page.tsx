'use client';

/**
 * /app/polymarket-agent — Agent and Copier surfaces behind one tabbed page.
 *
 * The Agent tab keeps the original "coming soon" AI positioning preview.
 * The Copier tab is the frontend entry for the copy trading service
 * (activation wizard lands here when the service ships). The active tab is
 * stored in the ?tab= search param so both surfaces are deep-linkable and
 * survive refresh; unknown values fall back to the agent tab.
 */
import { Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { AgentCopierTabs } from '@/components/polymarket-agent/agent-copier-tabs';
import { AgentPanel } from '@/components/polymarket-agent/agent-panel';
import { CopierPanel } from '@/components/polymarket-agent/copier-panel';
import { FundsPanel } from '@/components/polymarket-agent/funds-panel';
import { parseAgentTab, type AgentTab } from '@/components/polymarket-agent/tab-param';

function PolymarketAgentPageContent() {
  const t = useTranslations('dashboard.polymarketAgent');
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = parseAgentTab(searchParams.get('tab'));

  const handleTabChange = useCallback(
    (next: AgentTab) => {
      // Shallow URL update: no navigation, keeps scroll position.
      router.replace(`/app/polymarket-agent?tab=${next}`, { scroll: false });
    },
    [router]
  );

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <AgentCopierTabs
        value={tab}
        onValueChange={handleTabChange}
        agent={<AgentPanel />}
        copier={<CopierPanel />}
        funds={<FundsPanel />}
      />
    </main>
  );
}

export default function PolymarketAgentPage() {
  // useSearchParams requires a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <PolymarketAgentPageContent />
    </Suspense>
  );
}
