'use client';

/**
 * polymarket-agent/copier-panel.tsx — the Copier tab content.
 *
 * The copying activity surface: activation (create or import a wallet to
 * enable copying), trader subscriptions with strategy sizing and status
 * controls, and the recent execution history. Adding/withdrawing funds
 * lives in the Funds tab (funds-panel.tsx). States follow the form and
 * feedback rules: visible labels, errors near fields, loading buttons,
 * empty states with guidance, and no dead-end failures.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Users,
  Wallet,
  PauseCircle,
  PlayCircle,
  StopCircle,
  Plus,
  KeyRound,
  Activity,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TwoFaChallenge } from './two-fa-challenge';
import { Crown } from 'lucide-react';
import { UpgradeDialog } from './upgrade-dialog';
import {
  activateWallet,
  beaconCopierViewed,
  createSubscription,
  fetchBilling,
  fetchExecutions,
  fetchSubscriptions,
  fetchWallet,
  updateSubscription,
  type CopierEntitlement,
  type CopierExecution,
  type CopierSubscription,
  type CopierWallet,
} from './copier-hooks';

type LoadState = 'loading' | 'unconfigured' | 'active' | 'error';

export function CopierPanel() {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const [state, setState] = useState<LoadState>('loading');
  const [wallet, setWallet] = useState<CopierWallet | null>(null);
  const [subscriptions, setSubscriptions] = useState<CopierSubscription[]>([]);
  const [executions, setExecutions] = useState<CopierExecution[]>([]);
  const [entitlement, setEntitlement] = useState<CopierEntitlement | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Funnel milestone: the Copier tab was opened (server dedupes per day).
  useEffect(() => {
    beaconCopierViewed();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [walletRes, billingRes] = await Promise.all([fetchWallet(), fetchBilling().catch(() => null)]);
      if (cancelled) return;
      if (walletRes.status === 503) {
        setState('unconfigured');
        return;
      }
      if (!walletRes.ok && walletRes.status !== 404) {
        setState('error');
        return;
      }
      setWallet(walletRes.data ?? null);
      if (billingRes?.ok && billingRes.data?.pricing) setEntitlement(billingRes.data);
      const [subsRes, execRes] = await Promise.all([fetchSubscriptions(), fetchExecutions()]);
      if (cancelled) return;
      if (subsRes.ok) setSubscriptions(subsRes.data ?? []);
      if (execRes.ok) setExecutions(execRes.data ?? []);
      setState('active');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  if (state === 'loading') {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">{t('loading')}</CardContent>
      </Card>
    );
  }

  if (state === 'unconfigured') {
    return (
      <Card>
        <CardContent className="space-y-2 p-6">
          <p className="font-display text-lg font-bold">{t('headline')}</p>
          <p className="max-w-prose text-sm text-muted-foreground">{t('unconfiguredBody')}</p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-medium">{t('loadErrorTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('loadErrorBody')}</p>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={refresh}>
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!wallet && <ActivationCard onActivated={refresh} />}

      {wallet && (
        <SubscriptionsCard
          subscriptions={subscriptions}
          onChanged={refresh}
          entitlement={entitlement}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      )}

      {wallet && <ExecutionsCard executions={executions} />}

      {entitlement && (
        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          entitlement={entitlement}
          onSubscribed={refresh}
        />
      )}
    </div>
  );
}

function ActivationCard({ onActivated }: { onActivated: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [privateKey, setPrivateKey] = useState('');
  const [proxyWallet, setProxyWallet] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [need2fa, setNeed2fa] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const body =
      mode === 'create'
        ? { origin: 'create' as const }
        : privateKey.trim().startsWith('0x') && proxyWallet.trim()
          ? { origin: 'import_safe_owner' as const, privateKey: privateKey.trim(), proxyWallet: proxyWallet.trim() }
          : { origin: 'import_eoa' as const, privateKey: privateKey.trim() };
    const res = await activateWallet(body);
    setBusy(false);
    if (res.ok) {
      onActivated();
      setNeed2fa(false);
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('activateFailed'));
    }
  };

  const valid =
    mode === 'create' ||
    (/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey.trim()) &&
      (!privateKey.trim().startsWith('0x') || /^0x[0-9a-fA-F]{40}$/.test(proxyWallet.trim())));

  return (
    <Card>
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
            <Users className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-bold md:text-xl">{t('headline')}</p>
            <p className="max-w-prose text-sm text-muted-foreground">{t('body')}</p>
          </div>
        </div>

        <div className="flex gap-2" role="tablist" aria-label={t('activateTitle')}>
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer"
            onClick={() => setMode('create')}
            aria-pressed={mode === 'create'}
          >
            <Wallet data-icon="inline-start" />
            {t('createWallet')}
          </Button>
          <Button
            type="button"
            variant={mode === 'import' ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer"
            onClick={() => setMode('import')}
            aria-pressed={mode === 'import'}
          >
            <KeyRound data-icon="inline-start" />
            {t('importWallet')}
          </Button>
        </div>

        {mode === 'import' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="copier-private-key">{t('privateKeyLabel')}</Label>
              <Input
                id="copier-private-key"
                type="password"
                autoComplete="off"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder={t('privateKeyPlaceholder')}
                aria-describedby="copier-private-key-help"
              />
              <p id="copier-private-key-help" className="text-xs text-muted-foreground">
                {t('privateKeyHelp')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="copier-proxy-wallet">{t('proxyWalletLabel')}</Label>
              <Input
                id="copier-proxy-wallet"
                value={proxyWallet}
                onChange={(e) => setProxyWallet(e.target.value)}
                placeholder={t('proxyWalletPlaceholder')}
                aria-describedby="copier-proxy-help"
              />
              <p id="copier-proxy-help" className="text-xs text-muted-foreground">
                {t('proxyWalletHelp')}
              </p>
            </div>
          </div>
        )}

        {need2fa && <TwoFaChallenge onVerified={() => void submit()} />}
        {error && (
          <p role="alert" className="text-sm text-ios-red">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={submit} disabled={busy || !valid} className="cursor-pointer">
            {busy ? t('activating') : t('activateCta')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('activateHint')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionsCard({
  subscriptions,
  onChanged,
  entitlement,
  onUpgrade,
}: {
  subscriptions: CopierSubscription[];
  onChanged: () => void;
  entitlement: CopierEntitlement | null;
  onUpgrade: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tb = useTranslations('dashboard.polymarketAgent.copier.billing');
  const isPro = entitlement?.tier === 'pro';
  const slots = entitlement?.slots;
  const liveCount = subscriptions.filter((s) => s.status === 'live').length;
  const [traderAddress, setTraderAddress] = useState('');
  const [copySize, setCopySize] = useState('10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await createSubscription({
      traderAddress: traderAddress.trim(),
      strategyConfig: {
        strategy: 'PERCENTAGE',
        copySize: Number(copySize) || 10,
        maxOrderSizeUsd: 100,
        minOrderSizeUsd: 1,
      },
    });
    setBusy(false);
    if (res.ok) {
      setTraderAddress('');
      onChanged();
    } else {
      setError(res.error?.message ?? t('addTraderFailed'));
    }
  };

  const setStatus = async (id: string, status: CopierSubscription['status']) => {
    await updateSubscription(id, { status });
    onChanged();
  };

  const validAddress = /^0x[0-9a-fA-F]{40}$/.test(traderAddress.trim());

  return (
    <Card>
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('tradersTitle')}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t('traderCount', { count: subscriptions.length })}
            </span>
            {entitlement?.billingEnabled && slots !== undefined ? (
              isPro ? (
                <Badge variant="secondary" className="bg-ios-gold/15 text-ios-gold">
                  <Crown className="size-3" aria-hidden="true" />
                  PRO
                </Badge>
              ) : (
                <button
                  type="button"
                  className="cursor-pointer rounded-full"
                  onClick={onUpgrade}
                  aria-label={tb('upgradeCta')}
                >
                  <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                    FREE · {liveCount}/{slots}
                  </Badge>
                </button>
              )
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="copier-trader-address">{t('traderAddressLabel')}</Label>
            <Input
              id="copier-trader-address"
              value={traderAddress}
              onChange={(e) => setTraderAddress(e.target.value)}
              placeholder="0x..."
              aria-invalid={!validAddress && traderAddress.length > 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="copier-copy-size">{t('copySizeLabel')}</Label>
            <Input
              id="copier-copy-size"
              type="number"
              min={1}
              max={100}
              value={copySize}
              onChange={(e) => setCopySize(e.target.value)}
              className="w-24"
            />
          </div>
          <Button type="button" onClick={add} disabled={busy || !validAddress} className="cursor-pointer">
            <Plus data-icon="inline-start" />
            {t('addTrader')}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-ios-red">
            {error}
          </p>
        )}

        {subscriptions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t('noTraders')}
          </p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-mono text-xs">{sub.traderAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('strategySummary', {
                      strategy: sub.strategyConfig.strategy,
                      size: sub.strategyConfig.copySize,
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={sub.status} />
                  {sub.status === 'preview' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => void setStatus(sub.id, 'live')}
                    >
                      <PlayCircle data-icon="inline-start" />
                      {t('goLive')}
                    </Button>
                  )}
                  {sub.status === 'live' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => void setStatus(sub.id, 'paused')}
                    >
                      <PauseCircle data-icon="inline-start" />
                      {t('pause')}
                    </Button>
                  )}
                  {sub.status === 'paused' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => void setStatus(sub.id, 'live')}
                    >
                      <PlayCircle data-icon="inline-start" />
                      {t('resume')}
                    </Button>
                  )}
                  {sub.status !== 'stopped' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer text-ios-red hover:text-ios-red"
                      onClick={() => void setStatus(sub.id, 'stopped')}
                    >
                      <StopCircle data-icon="inline-start" />
                      {t('stop')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: CopierSubscription['status'] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tone =
    status === 'live'
      ? 'bg-ios-green/10 text-ios-green'
      : status === 'preview'
        ? 'bg-ios-blue/10 text-ios-blue'
        : status === 'paused'
          ? 'bg-ios-orange/10 text-ios-orange'
          : 'bg-muted text-muted-foreground';
  return (
    <Badge variant="secondary" className={tone}>
      {t(`status.${status}`)}
    </Badge>
  );
}

function ExecutionsCard({ executions }: { executions: CopierExecution[] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  return (
    <Card>
      <CardContent className="space-y-3 p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Activity className="size-4" />
          {t('executionsTitle')}
        </h2>
        {executions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t('noExecutions')}
          </p>
        ) : (
          <ul className="space-y-2">
            {executions.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Copy className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{e.market.slug ?? e.market.asset ?? e.id}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {t('executionTraderSize', {
                      size: Number(e.traderUsdcSize).toFixed(2),
                      side: e.market.side ?? '',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {e.sizing?.finalAmount !== undefined && e.sizing.finalAmount > 0 && (
                    <span className="font-mono tabular-nums">${e.sizing.finalAmount.toFixed(2)}</span>
                  )}
                  <Badge variant="secondary">{e.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
