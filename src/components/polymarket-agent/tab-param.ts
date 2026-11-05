/**
 * polymarket-agent/tab-param.ts — URL <-> tab validation for /app/polymarket-agent.
 *
 * The page keeps its Agent / Copier tab state in the `?tab=` search param so
 * both surfaces are deep-linkable and shareable. This module is the only
 * place that maps a raw query value to a tab id; anything unknown falls
 * back to the agent tab so a crafted URL can never select an unexpected
 * panel.
 */

export const AGENT_TABS = ['agent', 'copier', 'funds'] as const;

export type AgentTab = (typeof AGENT_TABS)[number];

/** Default tab when the URL carries no (or an invalid) ?tab= value. */
export const DEFAULT_AGENT_TAB: AgentTab = 'agent';

export function isAgentTab(value: unknown): value is AgentTab {
  return value === 'agent' || value === 'copier' || value === 'funds';
}

/**
 * Normalize a raw ?tab= value to a valid tab id. Case-insensitive, trims
 * surrounding whitespace, and falls back to the agent tab.
 */
export function parseAgentTab(value: string | null | undefined): AgentTab {
  const normalized = value?.trim().toLowerCase();
  return isAgentTab(normalized) ? normalized : DEFAULT_AGENT_TAB;
}
