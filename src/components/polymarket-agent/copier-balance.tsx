'use client';

/**
 * polymarket-agent/copier-balance.tsx — the compact copier balance strip on
 * the Portfolio page. Full-width slim card above the stat grid: spendable
 * USDC as the anchor number, POL gas + open tokens as muted sub-rows, and
 * exactly one primary action ("Manage funds"). Every state from the design
 * plan's matrix is explicit: loading skeleton, no wallet CTA, unconfigured
 * hidden, funded, zero with add-funds path, error with retry.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Landmark, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchBalances, type CopierBalances } from './copier-hooks';

type StripState = 'loading' | 'hidden' | 'noWallet' | 'ready' | 'error';

export function CopierBalanceStrip() {
  const t = useTranslations('dashboard.polymarketAgent.copier.balance');
  const [state, setState] = useState<StripState>('loading');
  const [balances, setBalances] = useState<CopierBalances | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchBalances();
      if (cancelled) return;
      if (res.status === 503) {
        setState('hidden');
        return;
      }
      if (res.status === 404) {
        setState('noWallet');
        return;
      }
      if (!res.ok) {
        setState('error');
        return;
      }
      setBalances(res.data ?? null);
      setState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setState('loading');
    setReloadKey((k) => k + 1);
  }, []);

  if (state === 'hidden') return null;

  if (state === 'loading') {
    return (
      <Card aria-busy="true">
        <CardContent className="flex items-center gap-3 p-4 md:p-5">
          <span className="flex size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'noWallet') {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('noWalletBody')}</p>
          </div>
          <Button asChild size="sm" className="cursor-pointer">
            <a href="/app/polymarket-agent?tab=copier">{t('setUpCopier')}</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4 md:p-5">
          <p className="text-sm text-muted-foreground">{t('errorBody')}</p>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={retry}>
            <RotateCw data-icon="inline-start" />
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usdc = Number(balances?.usdc ?? '0');
  const isZero = usdc <= 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
            <Landmark className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('title')}
            </p>
            <p
              className="font-display text-xl font-bold tabular-nums md:text-2xl"
              aria-live="polite"
            >
              {usdc.toFixed(2)} USDC
            </p>
            <p className="text-xs text-muted-foreground">
              {Number(balances?.pol ?? '0').toFixed(3)} {t('polGas')}
              {' · '}
              {t('openTokens', { count: Number(balances?.openTokens ?? 0) })}
            </p>
          </div>
        </div>
        {isZero ? (
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <a href="/app/polymarket-agent?tab=funds">{t('addFunds')}</a>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <a href="/app/polymarket-agent?tab=funds">{t('manageFunds')}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
