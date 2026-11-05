'use client';

/**
 * polymarket-agent/agent-copier-tabs.tsx — controlled tab shell.
 *
 * Wraps the shadcn Tabs primitive with the two surfaces of the
 * /app/polymarket-agent page: the Agent (AI positioning, coming soon) and
 * the Copier (copy trading). Controlled by the parent so the page can own
 * the value and sync it to the ?tab= search param; the shell itself stays
 * presentational and accessible (roving tabindex, aria-selected, panel
 * labelling come from Radix).
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Copy, Landmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAgentTab, type AgentTab } from './tab-param';

interface AgentCopierTabsProps {
  value: AgentTab;
  onValueChange: (tab: AgentTab) => void;
  agent: ReactNode;
  copier: ReactNode;
  funds: ReactNode;
}

export function AgentCopierTabs({ value, onValueChange, agent, copier, funds }: AgentCopierTabsProps) {
  const t = useTranslations('dashboard.polymarketAgent.tabs');

  const handleValueChange = (raw: string) => {
    onValueChange(isAgentTab(raw) ? raw : 'agent');
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabsList aria-label={t('ariaLabel')}>
        <TabsTrigger value="agent" className="cursor-pointer">
          <Bot data-icon="inline-start" />
          {t('agent')}
        </TabsTrigger>
        <TabsTrigger value="copier" className="cursor-pointer">
          <Copy data-icon="inline-start" />
          {t('copier')}
        </TabsTrigger>
        <TabsTrigger value="funds" className="cursor-pointer">
          <Landmark data-icon="inline-start" />
          {t('funds')}
        </TabsTrigger>
      </TabsList>
      {/* Radix unmounts the inactive panel; panels are lightweight and
          stateless, so default behavior keeps the a11y tree minimal. */}
      <TabsContent value="agent" className="mt-4 space-y-6">
        {agent}
      </TabsContent>
      <TabsContent value="copier" className="mt-4 space-y-6">
        {copier}
      </TabsContent>
      <TabsContent value="funds" className="mt-4 space-y-6">
        {funds}
      </TabsContent>
    </Tabs>
  );
}
