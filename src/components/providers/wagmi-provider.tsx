/**
 * components/providers/wagmi-provider.tsx — Phase 4.1 (Reown AppKit)
 *
 * AppKit init is client-only (no SSR analysis of wagmi/Coinbase deps).
 * The wagmi config is created lazily inside the component so the server
 * never sees the imports.
 */
'use client';

import { type ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config } from 'wagmi';

const queryClient = new QueryClient();

// AppKit init is client-only — never analyzed during SSR
const AppKitInit = dynamic(
  () => import('@/components/providers/appkit-init').then((m) => m.AppKitInit),
  { ssr: false },
);

interface Props {
  children: ReactNode;
  cookies?: string | null;
}

export function WagmiProviders({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);

  useEffect(() => {
    // Import wagmi config client-side only — avoids SSR analysis of Coinbase deps
    import('@/config/appkit').then((mod) => {
      setWagmiConfig(mod.wagmiConfig as Config);
      setMounted(true);
    });
  }, []);

  if (!mounted || !wagmiConfig) {
    return <div style={{ minHeight: '100vh' }} />;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* AppKitInit gates children: they mount only AFTER createAppKit() has
            run, so useAppKit()/useAppKitAccount() never render before the
            AppKit context exists (fixes the reload error). */}
        <AppKitInit>{children}</AppKitInit>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
