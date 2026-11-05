'use client';

/**
 * polymarket-agent/upgrade-dialog.tsx — PRO purchase flow.
 *
 * The user chooses the payment rail explicitly:
 *   - Copier wallet (USDC.e on Polygon): charged server-side from the
 *     custodial wallet; requires fresh 2FA, same trust tier as withdrawals.
 *   - Connected wallet (USDC on BSC): the service creates a pending intent
 *     with the treasury address and exact price; the user signs the USDC
 *     transfer from their own wallet and the tx hash is verified on-chain
 *     before PRO activates. No custody moves on this rail, no 2FA needed.
 *
 * The wagmi-backed transfer seam lives in ConnectedPayPanel, which mounts
 * only when a connected-wallet intent exists, so the dialog (and the
 * panels that host it) never touch the wallet provider when closed.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Crown, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TwoFaChallenge } from './two-fa-challenge';
import {
  subscribePro,
  verifyProPayment,
  type CopierEntitlement,
  type CopierPaymentIntent,
} from './copier-hooks';
import { useConnectedRailTransfer } from '@/lib/auth/connected-rail';

type Rail = 'copier_wallet' | 'connected_wallet';
type Stage = 'form' | 'awaiting_tx' | 'verifying' | 'done';

/** Connected-rail payment step; mounts wagmi only when actually paying. */
function ConnectedPayPanel({
  intent,
  onPaid,
  onBack,
}: {
  intent: CopierPaymentIntent;
  onPaid: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.upgrade');
  const { transferUsdc, isConnected } = useConnectedRailTransfer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pay = async () => {
    if (!intent.treasuryAddress) {
      setError(t('failed'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { txHash } = await transferUsdc({
        tokenAddress: intent.tokenAddress,
        toAddress: intent.treasuryAddress,
        amountUsdc: Number(intent.amountUsdc),
      });
      // The receipt may lag the broadcast; verify with retries.
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await verifyProPayment(intent.billingId, txHash);
        if (res.ok && res.data?.status === 'active') {
          onPaid();
          return;
        }
        const code = res.error?.code;
        if (code === 'tx_reused' || code === 'intent_expired') break;
        await new Promise((r) => setTimeout(r, 3000));
      }
      setError(t('verifyFailed'));
    } catch {
      setError(t('failed'));
    } finally {
      setBusy(false);
    }
  };

  const copyTreasury = async () => {
    try {
      await navigator.clipboard.writeText(intent.treasuryAddress ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the address stays visible.
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('sendExact')}</p>
      <div className="space-y-2 rounded-xl border border-border p-3">
        <div>
          <Label className="text-xs text-muted-foreground">{t('amountLabel')}</Label>
          <p className="font-mono text-sm tabular-nums">{Number(intent.amountUsdc).toFixed(2)} USDC</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('toLabel')}</Label>
          <p className="flex items-center gap-1 break-all font-mono text-xs">
            {intent.treasuryAddress}
            <button
              type="button"
              aria-label={t('copyAddress')}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
              onClick={() => void copyTreasury()}
            >
              <Copy className="size-3.5" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="sr-only">
              {copied ? t('copied') : ''}
            </span>
          </p>
        </div>
        <Badge variant="secondary">{t('networkLabel', { chainId: intent.chainId })}</Badge>
      </div>
      {!isConnected && <p className="text-xs text-ios-orange">{t('connectFirst')}</p>}
      {error && (
        <p role="alert" className="text-sm text-ios-red">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" className="cursor-pointer" onClick={onBack}>
          {t('later')}
        </Button>
        <Button className="cursor-pointer" disabled={busy} onClick={() => void pay()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Wallet data-icon="inline-start" />}
          {t('openWallet')}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function UpgradeDialog({
  open,
  onOpenChange,
  entitlement,
  onSubscribed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entitlement: CopierEntitlement;
  onSubscribed: () => void;
}) {
  const t = useTranslations('dashboard.polymarketAgent.copier.upgrade');
  const price = Number(entitlement.pricing.proPriceUsdc);

  const [rail, setRail] = useState<Rail>('copier_wallet');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [need2fa, setNeed2fa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CopierPaymentIntent | null>(null);

  const close = (next: boolean) => {
    if (!next) {
      setStage('form');
      setIntent(null);
      setNeed2fa(false);
      setError(null);
      setConsent(false);
      setBusy(false);
    }
    onOpenChange(next);
  };

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      if (rail === 'copier_wallet') {
        const res = await subscribePro({ paymentSource: rail, consent: true });
        if (res.ok && res.data?.status === 'active') {
          setStage('done');
          setNeed2fa(false);
          onSubscribed();
          return;
        }
        if (res.error?.code === '2fa_required') {
          setNeed2fa(true);
          return;
        }
        setError(res.error?.message ?? t('failed'));
        return;
      }

      // Connected rail: intent first; payment happens in ConnectedPayPanel.
      if (!intent) {
        const res = await subscribePro({ paymentSource: rail, consent: true });
        const pi = res.data?.paymentIntent;
        if (res.ok && pi?.treasuryAddress) {
          setIntent(pi);
          setStage('awaiting_tx');
          return;
        }
        setError(res.error?.message ?? t('failed'));
      }
    } catch {
      setError(t('failed'));
    } finally {
      setBusy(false);
    }
  };

  const railOption = (
    value: Rail,
    label: string,
    detail: string,
    icon: React.ReactNode
  ) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
        rail === value ? 'border-ios-blue bg-ios-blue/5' : 'border-border hover:bg-muted/40'
      }`}
    >
      <input
        type="radio"
        name="copier-payment-rail"
        value={value}
        checked={rail === value}
        onChange={() => {
          setRail(value);
          setError(null);
        }}
        className="mt-0.5 size-4 cursor-pointer"
        aria-label={label}
      />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="size-5 text-ios-gold" aria-hidden="true" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {stage === 'done' ? (
          <div className="space-y-3" role="status">
            <p className="flex items-center gap-2 text-sm font-medium text-ios-green">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t('success')}
            </p>
            <DialogFooter>
              <Button className="cursor-pointer" onClick={() => close(false)}>
                {t('done')}
              </Button>
            </DialogFooter>
          </div>
        ) : stage === 'awaiting_tx' && intent ? (
          <ConnectedPayPanel
            intent={intent}
            onPaid={() => {
              setStage('done');
              onSubscribed();
            }}
            onBack={() => setStage('awaiting_tx')}
          />
        ) : (
          <div className="space-y-4">
            {/* What PRO includes */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-border p-2.5">
                <p className="text-lg font-bold tabular-nums">
                  {entitlement.pricing.freeSlots}
                </p>
                <p className="text-xs text-muted-foreground">{t('freeSlotsLabel')}</p>
                <p className="mt-1 text-xs tabular-nums">
                  {entitlement.pricing.feeBpsFree / 100}% {t('feeSuffix')}
                </p>
              </div>
              <div className="rounded-xl border border-ios-gold/40 bg-ios-gold/5 p-2.5">
                <p className="text-lg font-bold tabular-nums">
                  {entitlement.pricing.proSlots}
                </p>
                <p className="text-xs text-muted-foreground">{t('proSlotsLabel')}</p>
                <p className="mt-1 text-xs tabular-nums">
                  {entitlement.pricing.feeBpsPro / 100}% {t('feeSuffix')}
                </p>
              </div>
            </div>

            {railOption(
              'copier_wallet',
              t('railCopier'),
              t('railCopierDetail'),
              <Wallet className="size-4" aria-hidden="true" />
            )}
            {railOption(
              'connected_wallet',
              t('railConnected'),
              t('railConnectedDetail'),
              <ShieldCheck className="size-4" aria-hidden="true" />
            )}

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 cursor-pointer"
              />
              <span>{t('consent', { price: `$${price}`, days: entitlement.pricing.proPeriodDays })}</span>
            </label>

            {need2fa && <TwoFaChallenge onVerified={() => void pay()} />}
            {error && (
              <p role="alert" className="text-sm text-ios-red">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => close(false)}>
                {t('cancel')}
              </Button>
              <Button className="cursor-pointer" disabled={!consent || busy} onClick={() => void pay()}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Crown data-icon="inline-start" />}
                {t('pay', { price: `$${price}` })}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
