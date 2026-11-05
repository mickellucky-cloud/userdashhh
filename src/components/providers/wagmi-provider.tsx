/**
 * components/providers/wagmi-provider.tsx — Phase 4.1 (Reown AppKit)
 *
 * Optimized for slow networks:
 *  - Renders <AppShellSkeleton /> immediately during SSR and initial chunk load
 *    so users never see a blank white/dark screen on 2G/3G connections.
 *  - Loads @/config/appkit and @/components/providers/appkit-init in a single
 *    parallel Promise.all pass instead of a sequential dynamic waterfall.
 *  - Uses adaptive React Query cache settings (getOptimalQueryConfig) so
 *    slow connections cache responses up to 3x longer and avoid window-focus refetches.
 */
'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { WagmiProvider, type Config } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShellSkeleton } from '@/components/dashboard/data-state';
import { getBrowserConnection, getOptimalQueryConfig } from '@/lib/network-perf';

let cachedWagmiConfig: Config | null = null;

interface Props {
  children: ReactNode;
  cookies?: string | null;
}

export function WagmiProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: getOptimalQueryConfig(getBrowserConnection()),
        },
      }),
  );

  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(cachedWagmiConfig);

  useEffect(() => {
    if (cachedWagmiConfig) {
      setWagmiConfig(cachedWagmiConfig);
      return;
    }

    // Parallel load both config and initializer in a single round-trip
    Promise.all([
      import('@/config/appkit'),
      import('@/components/providers/appkit-init'),
    ]).then(([configMod, initMod]) => {
      initMod.initAppKitOnce();
      cachedWagmiConfig = configMod.wagmiConfig as Config;
      setWagmiConfig(cachedWagmiConfig);
    });
  }, []);

  if (!wagmiConfig) {
    return <AppShellSkeleton />;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
