/**
 * components/providers/query-provider.tsx — Phase 4.11
 * TanStack Query client with slow-connection adaptive caching.
 */
'use client';

import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getBrowserConnection, getOptimalQueryConfig } from '@/lib/network-perf';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: getOptimalQueryConfig(getBrowserConnection()),
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
