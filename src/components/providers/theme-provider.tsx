/**
 * components/providers/theme-provider.tsx — Phase 5
 * iOS aesthetic is light-only for v1 (mobile-native feel). Placeholder for dark mode.
 */
'use client';

import { type ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
