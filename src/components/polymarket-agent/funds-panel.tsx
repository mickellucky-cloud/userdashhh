'use client';

/**
 * polymarket-agent/funds-panel.tsx — the Funds tab content.
 *
 * Everything about adding or withdrawing funds for the copier wallet:
 * the deposit address (add funds), one-time private key export
 * (self-custody), and the withdrawal flow (allowlist with 24h cooldown,
 * request form, history). Activation of the wallet itself happens on the
 * Copier tab; without a wallet this tab explains that first step.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wallet,
  Plus,
  KeyRound,
  Copy,
  Check,
  ArrowDownToLine,
  Landmark,
  TriangleAlert,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TwoFaChallenge } from './two-fa-challenge';
import { UpgradeDialog } from './upgrade-dialog';
import { FeeCard } from './fee-card';
import { fetchBilling, type CopierEntitlement } from './copier-hooks';
import { useRouter } from '@/i18n/navigation';
import {
  addAllowlistAddress,
  exportWalletKey,
  fetchAllowlist,
  fetchFees,
  fetchWallet,
  fetchWithdrawals,
  requestWithdrawal,
  fetchBalances,
  type CopierBalances,
  type AllowlistAddress,
  type CopierWallet,
  type Withdrawal,
} from './copier-hooks';

type LoadState = 'loading' | 'unconfigured' | 'active' | 'error';

export function FundsPanel() {
  const t = useTranslations('dashboard.polymarketAgent.copier.funds');
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [wallet, setWallet] = useState<CopierWallet | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const walletRes = await fetchWallet();
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
      setState('active');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const goCopier = useCallback(() => {
    router.replace('/app/polymarket-agent?tab=copier', { scroll: false });
  }, [router]);

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
        <CardContent className="p-6 text-sm text-muted-foreground">{t('unconfiguredBody')}</CardContent>
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

  if (!wallet) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
            <Landmark className="size-6" />
          </span>
          <p className="text-sm font-medium">{t('activateFirstTitle')}</p>
          <p className="max-w-prose text-xs text-muted-foreground">{t('activateFirstBody')}</p>
          <Button size="sm" className="cursor-pointer" onClick={goCopier}>
            {t('goToCopier')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <WalletCard wallet={wallet} onExported={refresh} />
      <BillingCard />
      <FeeCard />
      <WithdrawCard onChanged={refresh} />
    </div>
  );
}

/**
 * PRO membership card: tier state, renewal/expiry, and the upgrade entry.
 * Billing disabled (canary shadow mode) shows an informational state so
 * pricing never surprises anyone.
 */
function BillingCard() {
  const t = useTranslations('dashboard.polymarketAgent.copier.billing');
  const [entitlement, setEntitlement] = useState<CopierEntitlement | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchBilling();
    if (res.ok && res.data?.pricing) setEntitlement(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!entitlement) return null;

  const isPro = entitlement.tier === 'pro';

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {t('title')}
            {isPro ? (
              <Badge variant="secondary" className="bg-ios-gold/15 text-ios-gold">
                {t('proActive')}
              </Badge>
            ) : null}
          </p>
          {isPro && entitlement.periodEnd ? (
            <p className="text-xs text-muted-foreground">
              {t('expiresOn', { date: new Date(entitlement.periodEnd).toLocaleDateString() })}
            </p>
          ) : entitlement.billingEnabled ? (
            <p className="text-xs text-muted-foreground">
              {t('priceLabel', {
                price: `$${Number(entitlement.pricing.proPriceUsdc).toFixed(0)}`,
                days: entitlement.pricing.proPeriodDays,
              })}
              {' · '}
              {t('feeNow', { rate: entitlement.pricing.feeBpsPro / 100 })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t('comingSoon')}</p>
          )}
        </div>
        {entitlement.billingEnabled ? (
          <Button
            type="button"
            size="sm"
            variant={isPro ? 'outline' : 'default'}
            className="cursor-pointer"
            onClick={() => setUpgradeOpen(true)}
          >
            {isPro ? t('renew') : t('upgradeCta')}
          </Button>
        ) : null}
      </CardContent>
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        entitlement={entitlement}
        onSubscribed={() => void load()}
      />
    </Card>
  );
}

/** Confirm + one-time reveal dialog for the wallet private key. */
function ExportKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.export');
  const [stage, setStage] = useState<'confirm' | 'revealed'>('confirm');
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  const reveal = async () => {
    setBusy(true);
    setError(null);
    const res = await exportWalletKey();
    setBusy(false);
    if (res.ok && res.data) {
      setKey(res.data.privateKey);
      setStage('revealed');
      setNeed2fa(false);
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('failed'));
    }
  };

  const close = (open: boolean) => {
    if (!open) {
      // Reset so the key never lingers in component state after close.
      setStage('confirm');
      setKey(null);
      setCopied(false);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        {stage === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-ios-orange" />
                {t('confirmTitle')}
              </DialogTitle>
              <DialogDescription>{t('confirmBody')}</DialogDescription>
            </DialogHeader>
            {need2fa && (
              <TwoFaChallenge onVerified={() => void reveal()} />
            )}
            {error && (
              <p role="alert" className="text-sm text-ios-red">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                disabled={busy}
                onClick={() => void reveal()}
              >
                <KeyRound data-icon="inline-start" />
                {busy ? t('revealing') : t('reveal')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('revealedTitle')}</DialogTitle>
              <DialogDescription>{t('revealedBody')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="break-all rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
                {key}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={async () => {
                  if (key) await navigator.clipboard.writeText(key);
                  setCopied(true);
                }}
              >
                <Copy data-icon="inline-start" />
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
            <DialogFooter>
              <Button className="cursor-pointer" onClick={() => close(false)}>
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WalletCard({
  wallet,
  onExported,
}: {
  wallet: CopierWallet;
  onExported: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier');
  const tw = useTranslations('dashboard.polymarketAgent.copier.wallet');
  const [exportOpen, setExportOpen] = useState(false);
  const [balances, setBalances] = useState<CopierBalances | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, tickClock] = useState(0);
  const [copied, setCopied] = useState(false);

  const loadBalances = useCallback(async () => {
    setRefreshing(true);
    const res = await fetchBalances();
    setRefreshing(false);
    if (res.ok) setBalances(res.data ?? null);
  }, []);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  // Re-render every 5s so the updated-ago stamp stays honest.
  useEffect(() => {
    const timer = setInterval(() => tickClock((n) => n + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const updatedAt = balances ? new Date(balances.updatedAt).getTime() : null;
  const agoSeconds = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions); the address is visible anyway.
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-ios-blue/10 via-ios-green/5 to-transparent p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
              <Wallet className="size-6" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {tw('spendable')}
              </p>
              <p className="font-display text-3xl font-bold tabular-nums md:text-4xl" aria-live="polite">
                {balances ? `${Number(balances.usdc).toFixed(2)} USDC` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tw('gasLabel')}:{' '}
                <span className="font-mono tabular-nums">
                  {balances ? Number(balances.pol).toFixed(3) : '—'}
                </span>
              </p>
              <p className="flex items-center gap-1 break-all pt-1 font-mono text-xs text-foreground/80">
                {wallet.address}
                <button
                  type="button"
                  aria-label={tw('copyAddress')}
                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
                  onClick={() => void copyAddress()}
                >
                  <Check className={copied ? 'size-3.5 text-ios-green' : 'hidden'} aria-hidden="true" />
                  <Copy className={copied ? 'hidden' : 'size-3.5'} aria-hidden="true" />
                </button>
                <span aria-live="polite" className="sr-only">
                  {copied ? tw('copiedAddress') : ''}
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
              <Badge variant="secondary" className="bg-ios-green/10 text-ios-green">
                {t(`origin.${wallet.origin}`)}
              </Badge>
              {balances?.allowance && (
                <Badge
                  variant="secondary"
                  className={
                    balances.allowance.usdcApproved
                      ? 'bg-ios-green/10 text-ios-green'
                      : 'bg-ios-orange/10 text-ios-orange'
                  }
                >
                  {balances.allowance.usdcApproved ? tw('allowanceApproved') : tw('allowanceNeeded')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {agoSeconds !== null ? tw('updatedAgo', { seconds: agoSeconds }) : ''}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={tw('refreshAria')}
                className="size-8 cursor-pointer"
                disabled={refreshing}
                onClick={() => void loadBalances()}
              >
                <RotateCw className={refreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setExportOpen(true)}
              >
                <KeyRound data-icon="inline-start" />
                {t('export.exportKey')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ExportKeyDialog open={exportOpen} onOpenChange={(o) => { setExportOpen(o); if (!o) onExported(); }} />
    </Card>
  );
}

/** Allowlist cooldown state derived from effectiveAfter. */
function cooldownActive(effectiveAfter: string): boolean {
  return new Date(effectiveAfter).getTime() > Date.now();
}

/**
 * Withdraw funds: allowlist management (24h anti-hijack cooldown), the
 * request form, and the withdrawal history with on-chain status.
 */
function WithdrawCard({ onChanged }: { onChanged: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const [allowlist, setAllowlist] = useState<AllowlistAddress[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [allowRes, wdRes] = await Promise.all([fetchAllowlist(), fetchWithdrawals()]);
      if (cancelled) return;
      if (allowRes.ok) setAllowlist(allowRes.data ?? []);
      if (wdRes.ok) setWithdrawals(wdRes.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return (
    <Card>
      <CardContent className="space-y-5 p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Landmark className="size-4" />
          {t('title')}
        </h2>

        {/* Allowlist */}
        <section className="space-y-2">
          <p className="text-sm font-semibold">{t('allowlistTitle')}</p>
          <AddAllowlistRow onAdded={refresh} />
          {allowlist.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              {t('allowlistEmpty')}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {allowlist.map((a) => {
                const cooling = cooldownActive(a.effectiveAfter);
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 rounded-lg border border-border/60 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs">{a.address}</p>
                      {a.label && (
                        <p className="text-xs text-muted-foreground">{a.label}</p>
                      )}
                    </div>
                    {cooling ? (
                      <Badge variant="secondary" className="bg-ios-orange/10 text-ios-orange">
                        {t('cooldownUntil', {
                          time: new Date(a.effectiveAfter).toLocaleString(),
                        })}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-ios-green/10 text-ios-green">
                        {t('allowlistActive')}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Request */}
        <RequestWithdrawalRow
          allowlist={allowlist.filter((a) => !cooldownActive(a.effectiveAfter))}
          onRequested={refresh}
        />

        {/* History */}
        <section aria-label={t('historyTitle')} className="space-y-2">
          <p className="text-sm font-semibold">{t('historyTitle')}</p>
          {withdrawals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              {t('historyEmpty')}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono">{w.address}</p>
                    {w.txHash && (
                      <p className="truncate text-muted-foreground">tx: {w.txHash}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">
                      ${Number(w.amountUsdc).toFixed(2)}
                    </span>
                    <WithdrawalStatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function AddAllowlistRow({ onAdded }: { onAdded: () => void }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address.trim());

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await addAllowlistAddress({ address: address.trim() });
    setBusy(false);
    if (res.ok) {
      setAddress('');
      onAdded();
    } else {
      setError(res.error?.message ?? t('addFailed'));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          aria-label={t('addressLabel')}
          aria-invalid={!valid && address.length > 0}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={busy || !valid}
          onClick={() => void add()}
        >
          <Plus data-icon="inline-start" />
          {t('addAddress')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('allowlistHelp')}</p>
      {error && (
        <p role="alert" className="text-sm text-ios-red">
          {error}
        </p>
      )}
    </div>
  );
}

function RequestWithdrawalRow({
  allowlist,
  onRequested,
}: {
  allowlist: AllowlistAddress[];
  onRequested: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);

  const amountNum = Number(amount);
  const valid = address !== '' && Number.isFinite(amountNum) && amountNum > 0;

  // Fee transparency: show the exact net payout (requested minus
  // outstanding fee debt) BEFORE the user submits.
  const [netEstimate, setNetEstimate] = useState<string | null>(null);
  useEffect(() => {
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setNetEstimate(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const res = await fetchFees(amountNum);
        if (!cancelled && res.ok && res.data) {
          setNetEstimate(res.data.nextWithdrawalNetUsdc);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amountNum]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setSuccess(false);
    const res = await requestWithdrawal({ address, amountUsdc: amountNum });
    setBusy(false);
    if (res.ok) {
      setSuccess(true);
      setNeed2fa(false);
      setAmount('');
      onRequested();
    } else if (res.error?.code === '2fa_required') {
      setNeed2fa(true);
    } else {
      setError(res.error?.message ?? t('requestFailed'));
    }
  };

  return (
    <section aria-label={t('requestTitle')} className="space-y-2">
      <p className="text-sm font-semibold">{t('requestTitle')}</p>
      {allowlist.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          {t('requestNoAddress')}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <Label htmlFor="withdraw-address" className="sr-only">
                {t('addressLabel')}
              </Label>
              <select
                id="withdraw-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSuccess(false);
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('selectAddress')}</option>
                {allowlist.map((a) => (
                  <option key={a.id} value={a.address}>
                    {a.address}
                    {a.label ? ` (${a.label})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="withdraw-amount" className="sr-only">
                {t('amountLabel')}
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSuccess(false);
                }}
                placeholder={t('amountLabel')}
                className="w-32"
              />
            </div>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={busy || !valid}
              onClick={() => void submit()}
            >
              <ArrowDownToLine data-icon="inline-start" />
              {busy ? t('requesting') : t('request')}
            </Button>
          </div>
          {netEstimate !== null && (
            <p role="status" className="text-xs text-muted-foreground">
              {t('netEstimate', { net: `$${Number(netEstimate).toFixed(2)}` })}
            </p>
          )}
          {need2fa && <TwoFaChallenge onVerified={() => void submit()} />}
          {success && (
            <p role="status" className="text-sm text-ios-green">
              {t('requestQueued')}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-ios-red">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function WithdrawalStatusBadge({ status }: { status: Withdrawal['status'] }) {
  const t = useTranslations('dashboard.polymarketAgent.copier.withdraw');
  const tone =
    status === 'done'
      ? 'bg-ios-green/10 text-ios-green'
      : status === 'failed'
        ? 'bg-ios-red/10 text-ios-red'
        : status === 'canceled'
          ? 'bg-muted text-muted-foreground'
          : 'bg-ios-blue/10 text-ios-blue';
  return (
    <Badge variant="secondary" className={tone}>
      {t(`status.${status}`)}
    </Badge>
  );
}
