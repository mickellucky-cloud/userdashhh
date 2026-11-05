/**
 * [locale]/app/layout.tsx — dashboard layout
 * Auth guard + responsive shell (sidebar on desktop, tab bar on mobile)
 * + Wagmi/AppKit providers.
 *
 * AppKit is loaded here (not in root layout) to avoid chunk corruption
 * from Lit web components affecting non-wallet routes (landing, login, etc).
 *
 * Locale: setRequestLocale makes the locale available for static rendering.
 * Nav labels are translation keys (resolved client-side in the sidebar).
 */
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { requireUser } from '@/lib/auth/guard';
import { AppShell } from '@/components/layout/app-shell';
import { WagmiProviders } from '@/components/providers/wagmi-provider';
import { routing, type Locale } from '@/i18n/routing';

// Nav structure: hrefs are structural (kept here), labels come from the
// dashboard.nav message namespace by key (resolved in the sidebar component).
const APP_NAV = [
  { href: '/app/portfolio', labelKey: 'portfolio' },
  { href: '/app/trade-bot', labelKey: 'aiTradingAgent' },
  { href: '/app/polymarket-agent', labelKey: 'polymarketAgent' },
  { href: '/app/prediction-markets', labelKey: 'predictionMarkets' },
  { href: '/app/leaderboard', labelKey: 'leaderboard' },
  { href: '/app/missions', labelKey: 'missions' },
  { href: '/app/tasks', labelKey: 'tasks' },
  { href: '/app/claim', labelKey: 'claim' },
  { href: '/app/buy', labelKey: 'buy' },
  { href: '/app/staking', labelKey: 'staking' },
  { href: '/app/news', labelKey: 'news' },
  { href: '/app/learn', labelKey: 'learn' },
  { href: '/app/wallet', labelKey: 'wallet' },
  { href: '/app/referral', labelKey: 'referral' },
  // Settings + Appearance live in the avatar dropdown (top-right), not the
  // sidebar, to avoid duplication. /app/settings is still a reachable route.
] as const;

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    // Layout-level validation; the [locale] root layout also checks.
  }
  setRequestLocale(locale);

  const session = await requireUser();
  const headersList = await headers();
  const cookies = headersList.get('cookie');

  return (
    <WagmiProviders cookies={cookies}>
      <AppShell
        area="app"
        navItems={APP_NAV}
        isAdmin={session.adminRole != null}
        roleLabel={session.adminRole?.replace('_', ' ') ?? undefined}
      >
        {children}
      </AppShell>
    </WagmiProviders>
  );
}
