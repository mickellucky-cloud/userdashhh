'use client';

/**
 * dashboard/buy-widget.tsx — buy form card (two-step: edit → review).
 *
 * Edit step: BNB amount input (MAX fills the exact on-chain headroom), live
 * $OKN preview, approx USD value from the public Chainlink feed, min/cap/
 * window/balance validation.
 * Review step: spend/receive/rate/allowance summary; Confirm re-checks the
 * on-chain rate (TokenSale.buy has no minOut, so the web layer aborts on a
 * rate change and re-quotes) before the wallet popup opens. Success decodes
 * the actual Bought amounts from the receipt; a receipt-wait timeout flips to
 * a persistent "still pending" state with an explorer link while the wait
 * continues in the background.
 *
 * On-chain reads (useSaleStatus) fall back to the DB sale config (useSalePrice)
 * when contracts are unreachable in dev. Production hardening (F03/F04/F05):
 * chain-pinned writes, full on-chain gating, hard-cap headroom capping,
 * success only after the receipt confirms, reverts decode to real reasons.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAccount, useBalance, usePublicClient, useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther, parseEther } from 'viem';
import { AlertCircle, ArrowLeft, Clock3, ExternalLink, Loader2, ShoppingCart, Wallet } from 'lucide-react';
import { tokenSaleAbi, CONTRACTS, APP_CONFIG, explorerTxUrl, type Purchase } from '@okn/shared';
import { useSalePrice } from '@/lib/hooks/use-sale';
import { useMe } from '@/lib/hooks/use-me';
import { usePurchasedAmount, useSaleStatus } from '@/lib/hooks/use-wallet';
import { useChainGuard } from '@/lib/hooks/use-chain-guard';
import { buyBlockReason, type BuyBlockReason } from '@/lib/chain-guard';
import { decodeChainError, isUserRejection } from '@/lib/chain-errors';
import {
  decodeBoughtFromReceipt,
  hasRateChanged,
  isReceiptTimeout,
} from '@/lib/buy-guard';
import { usePendingPurchases } from '@/lib/store/pending-purchases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatWei } from '@/lib/utils';
import {
  bnbWeiToUsd8,
  rateWeiToImpliedUsd8,
  usd8ToNumber,
} from '@/lib/price-math';

function toBigInt(value: string | null | undefined): bigint | undefined {
  if (value == null) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

/** 8-dec USD bigint → "$6.04" (display only). */
function formatUsd(usd8: bigint): string {
  return `$${usd8ToNumber(usd8).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BuyWidget() {
  const t = useTranslations('dashboard.buyWidget');
  const tToast = useTranslations('toasts.buy');
  const { address } = useAccount();
  const { toast } = useToast();
  const qc = useQueryClient();
  const publicClient = usePublicClient();
  const sale = useSalePrice();
  const me = useMe();
  const chain = useSaleStatus();
  const purchased = usePurchasedAmount();
  const guard = useChainGuard();
  const { writeContractAsync, isPending } = useWriteContract();
  const addOptimisticPurchase = usePendingPurchases((s) => s.add);
  const removeOptimisticPurchase = usePendingPurchases((s) => s.removeByTxHash);
  const balanceResult = useBalance({ address });
  const balance = typeof balanceResult.data?.value === 'bigint' ? balanceResult.data.value : undefined;

  const [amount, setAmount] = useState('');
  const [err, setErr] = useState<string | null>(null);
  // Two-step flow: 'edit' → [Buy] → 'review' → [Confirm] → wallet popup.
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  // Gap 3: the rate used for the review quote, re-checked before broadcast.
  const [rateSnapshot, setRateSnapshot] = useState<bigint | null>(null);
  const [rateChanged, setRateChanged] = useState(false);
  // Fresh rate after a detected change, used to re-quote the review view.
  const [rateOverride, setRateOverride] = useState<bigint | undefined>(undefined);
  // True from broadcast until the receipt lands.
  const [confirming, setConfirming] = useState(false);
  // Gap 7: receipt wait timed out but the tx may still mine — persistent state.
  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);

  const rawRate = rateOverride ?? chain.rate ?? toBigInt(sale.data?.rate);
  // A zero rate means the sale is not priced yet (e.g. setRate still pending
  // in the Safe). It must never reach the implied-USD math below, which
  // requires a positive rate. For draft-masked viewers a zero rate is the
  // mask by design — they keep the draft note, not the not-configured notice.
  const rate = rawRate != null && rawRate > 0n ? rawRate : null;
  const cap = chain.capPerWallet ?? toBigInt(sale.data?.capPerWallet);
  // F04: on-chain values win; the DB row is only a dev fallback.
  const minPurchase = chain.minPurchase ?? toBigInt(sale.data?.minPurchase) ?? 0n;
  // USD-denominated minimum (8-dec string from sale_config) — display only;
  // the contract enforces the derived BNB minimum (minPurchase) on-chain.
  const minPurchaseUsd =
    sale.data?.minPurchaseUsd != null && sale.data.minPurchaseUsd !== ''
      ? usd8ToNumber(BigInt(sale.data.minPurchaseUsd))
      : null;
  const paused = chain.paused ?? sale.data?.isPaused ?? false;

  // Soft-launch visibility gate (sale_config.sale_mode): in draft, non-admin
  // viewers cannot buy through the app (admins test-buy). The masked
  // /api/sale/price payload keeps saleMode 'draft', so this also holds when
  // the config itself is hidden.
  const isTestnet = APP_CONFIG.chainId === 97;
  const viewerIsSaleAdmin = me.data?.user?.adminRole != null;
  const saleVisibility = sale.data?.saleMode;
  const draftLocked = saleVisibility === 'draft' && !viewerIsSaleAdmin && !isTestnet;

  // Gap 2: public BNB/USD sibling fields on GET /api/sale/price (omitted on
  // feed failure — every USD display hides gracefully when unavailable).
  const bnbUsd8 = toBigInt(sale.data?.bnbUsd8) ?? null;
  const bnbUsdUpdatedAt = sale.data?.bnbUsdUpdatedAt;
  const bnbUsdStale = sale.data?.bnbUsdStale ?? false;

  let bnb: bigint | null = null;
  if (amount.trim()) {
    try {
      bnb = parseEther(amount.trim());
    } catch {
      bnb = null;
    }
  }

  const oknPreview = bnb != null && bnb > 0n && rate != null ? (bnb * rate) / 10n ** 18n : 0n;
  const spendUsd8 = bnb != null && bnb > 0n && bnbUsd8 != null ? bnbWeiToUsd8(bnb, bnbUsd8) : null;
  const pricePerOknUsd8 = rate != null && bnbUsd8 != null ? rateWeiToImpliedUsd8(rate, bnbUsd8) : null;
  const priceAgeSeconds =
    bnbUsdUpdatedAt != null ? Math.max(0, Math.floor(Date.now() / 1000) - bnbUsdUpdatedAt) : null;
  const remaining = cap != null && purchased.data != null ? cap - purchased.data : null;
  const allowanceAfter =
    remaining != null && bnb != null && bnb > 0n ? (remaining - bnb > 0n ? remaining - bnb : 0n) : null;
  const invalid = amount.trim() !== '' && bnb == null;
  const overCap =
    bnb != null &&
    bnb > 0n &&
    cap != null &&
    purchased.data != null &&
    bnb + purchased.data > cap;

  // F04 + gap 4: full on-chain gating (the same constraints the contract
  // enforces) THEN the client-only wallet-balance pre-check. The draft
  // visibility gate runs first (inside buyBlockReason) so a hidden sale is
  // never buyable even when the test-unpaused contract would accept it.
  const blockReason: BuyBlockReason | null =
    bnb != null && bnb > 0n
      ? buyBlockReason(
          {
            paused,
            visibility: saleVisibility,
            viewerIsSaleAdmin,
            isTestnet,
            saleStart: chain.saleStart,
            saleEnd: chain.saleEnd,
            minPurchase,
            bnbHardCap: chain.bnbHardCap,
            totalBnbRaised: chain.totalBnbRaised,
          },
          bnb,
          Math.floor(Date.now() / 1000),
          balance,
        )
      : draftLocked
        ? 'draft'
        : paused
          ? 'paused'
          : null;
  // Remaining hard-cap headroom (no partial fill at the cap: overshoot reverts).
  const hardCapRemaining =
    chain.bnbHardCap !== undefined && chain.totalBnbRaised !== undefined
      ? chain.bnbHardCap - chain.totalBnbRaised
      : null;
  const maxBnb =
    remaining !== null && hardCapRemaining !== null
      ? remaining < hardCapRemaining
        ? remaining
        : hardCapRemaining
      : (remaining ?? hardCapRemaining ?? null);

  function blockMessage(reason: BuyBlockReason): string {
    switch (reason) {
      case 'draft':
        return t('saleDraft');
      case 'paused':
        return t('salePaused');
      case 'not-started':
        return t('saleNotStarted');
      case 'ended':
        return t('saleEnded');
      case 'hard-cap':
        return t('errHardCap', { value: formatWei(hardCapRemaining ?? 0n) });
      case 'below-min':
        return t('errBelowMin', { value: formatWei(minPurchase) });
      case 'insufficient-balance':
        return t('errInsufficientBalance');
    }
  }

  // Sale must be configured (a positive rate from either the on-chain read or
  // the DB sale_config row) before buying is allowed — except for
  // draft-masked viewers, whose zeroed rate is the mask, not a missing price.
  const saleConfigured = rawRate != null && (rate != null || draftLocked);
  const canBuy =
    saleConfigured &&
    !!address &&
    bnb != null &&
    bnb > 0n &&
    !invalid &&
    !overCap &&
    blockReason === null &&
    !isPending &&
    !confirming;
  // MAX is only offered while the sale itself is open (window/paused/caps/draft).
  const nowSeconds = Math.floor(Date.now() / 1000);
  const saleAvailable =
    saleConfigured &&
    !paused &&
    !draftLocked &&
    (chain.saleStart === undefined || chain.saleStart === 0n || nowSeconds >= chain.saleStart) &&
    (chain.saleEnd === undefined || chain.saleEnd === 0n || nowSeconds <= chain.saleEnd);
  const showMax = saleAvailable && maxBnb !== null && maxBnb > 0n;

  // Gap 1: fill the input with the EXACT on-chain headroom. formatEther keeps
  // full wei precision; no rounding up (an over-cap tx would revert).
  const onMax = () => {
    if (maxBnb == null || maxBnb <= 0n) return;
    setAmount(formatEther(maxBnb));
    setErr(null);
  };

  const onReview = () => {
    setErr(null);
    if (!address) return setErr(t('errNotConnected'));
    if (bnb == null || bnb <= 0n) return setErr(t('errNoAmount'));
    // Gap 3: snapshot the rate this quote is based on.
    setRateSnapshot(rate ?? null);
    setRateChanged(false);
    setStep('review');
  };

  const onBack = () => {
    if (confirming) return;
    setErr(null);
    setRateChanged(false);
    setStep('edit');
  };

  /** Reset the form after a finalized (success or failed) purchase. */
  const resetForm = () => {
    setAmount('');
    setStep('edit');
    setRateSnapshot(null);
    setRateOverride(undefined);
    setRateChanged(false);
  };

  /**
   * Gap 7: reconcile the optimistic history row. Refetch and, once the
   * indexed row with the same txHash is in the fetched data, drop the
   * optimistic one (mergePurchaseRows hides duplicates in the meantime).
   */
  const reconcileOptimistic = (hash: `0x${string}`, delayMs: number) => {
    window.setTimeout(() => {
      void (async () => {
        await qc.invalidateQueries({ queryKey: ['purchase-history'] });
        const fetched = qc.getQueryData<Purchase[]>(['purchase-history']);
        if (fetched?.some((r) => r.txHash.toLowerCase() === hash.toLowerCase())) {
          removeOptimisticPurchase(hash);
        } else if (delayMs < 15_000) {
          reconcileOptimistic(hash, 15_000);
        }
      })();
    }, delayMs);
  };

  /** Finalize a confirmed receipt: success toast with ACTUAL amounts, optimistic history row, cache invalidation. */
  const finalizeReceipt = (receipt: { status: string; logs: unknown[] }, hash: `0x${string}`) => {
    setConfirming(false);
    setPendingHash(null);
    if (receipt.status !== 'success') {
      setErr(t('errReverted'));
      setStep('edit');
      return;
    }

    // Gap 3: show what the chain actually credited, not the preview.
    const bought = decodeBoughtFromReceipt(receipt);
    const actualOkn = bought?.oknAmount ?? oknPreview;

    // Gap 7: immediate "indexing" row; scheduled refetches replace it.
    addOptimisticPurchase({
      id: crypto.randomUUID(),
      bnbAmount: bought?.bnbAmount ?? bnb ?? 0n,
      oknAmount: actualOkn,
      txHash: hash,
      createdAt: new Date(),
      indexing: true,
    });

    toast({
      title: tToast('successTitle'),
      description: (
        <span className="flex flex-col gap-0.5">
          <span>{tToast('successDesc', { value: formatWei(actualOkn) })}</span>
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="text-ios-blue underline"
          >
            {tToast('submittedDescLink')}
          </a>
        </span>
      ),
    });
    resetForm();
    reconcileOptimistic(hash, 5_000);
    void qc.invalidateQueries({ queryKey: ['purchase-history'] });
    void qc.invalidateQueries({ queryKey: ['me'] });
    void qc.invalidateQueries({ queryKey: ['portfolio'] });
    void purchased.refetch();
  };

  const onConfirm = async () => {
    setErr(null);
    if (!address) {
      setErr(t('errNotConnected'));
      setStep('edit');
      return;
    }
    if (bnb == null || bnb <= 0n) {
      setErr(t('errNoAmount'));
      setStep('edit');
      return;
    }
    try {
      // F03: never broadcast on a foreign chain (irreversible native-fund loss).
      await guard.ensureCorrectChain();

      // Gap 3: re-read the on-chain rate right before broadcasting; a changed
      // rate aborts the send, re-quotes, and asks for a fresh confirmation.
      let freshRate: bigint | undefined;
      try {
        freshRate = (await publicClient!.readContract({
          address: CONTRACTS.tokenSale,
          abi: tokenSaleAbi,
          functionName: 'rate',
        })) as bigint;
      } catch {
        freshRate = undefined;
      }
      if (hasRateChanged(rateSnapshot, freshRate)) {
        setRateOverride(freshRate);
        setRateChanged(true);
        return;
      }

      const hash = await writeContractAsync({
        address: CONTRACTS.tokenSale,
        abi: tokenSaleAbi,
        functionName: 'buy',
        value: bnb,
        chainId: APP_CONFIG.chainId,
      });
      setConfirming(true);

      try {
        // F03: wait for the receipt; a revert must not show a success toast.
        const receipt = await publicClient!.waitForTransactionReceipt({
          hash,
          timeout: 120_000,
        });
        finalizeReceipt(receipt, hash);
      } catch (waitErr) {
        if (!isReceiptTimeout(waitErr)) throw waitErr;
        // Gap 7: the wait timed out but the tx is broadcast — switch to the
        // persistent "still pending" state and keep waiting in the background.
        setPendingHash(hash);
        void publicClient!
          .waitForTransactionReceipt({ hash, timeout: 600_000 })
          .then((receipt) => {
            finalizeReceipt(receipt, hash);
          })
          .catch((finalErr) => {
            setConfirming(false);
            setPendingHash(null);
            setErr(decodeChainError(finalErr, t('errFailed')));
            setStep('edit');
          });
      }
    } catch (e) {
      // Any validation/broadcast failure closes back to the edit state.
      setErr(isUserRejection(e) ? t('errRejected') : decodeChainError(e, t('errFailed')));
      setConfirming(false);
      setStep('edit');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {step === 'review' ? t('reviewDescription') : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {APP_CONFIG.chainId === 97 && (
          <div className="flex items-center justify-between gap-2 rounded-ios-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
            <span><strong>BSC Testnet Active (Chain 97).</strong> Use testnet BNB to test token purchases.</span>
            <a
              href="https://testnet.binance.org/faucet-smart"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold hover:text-amber-400 shrink-0"
            >
              Get Faucet BNB &rarr;
            </a>
          </div>
        )}
        {!saleConfigured ? (
          <div className="flex items-center gap-2 rounded-ios-lg border border-ios-orange/30 bg-ios-orange/5 p-3 text-sm text-ios-orange">
            <AlertCircle className="size-4 shrink-0" />
            <span>{t('errNotConfigured')}</span>
          </div>
        ) : step === 'review' ? (
          <>
            {/* Review step (gap 5): everything the buyer should sign off on. */}
            <dl className="space-y-3 rounded-ios-lg border border-border/60 bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t('reviewSpend')}</dt>
                <dd className="text-right font-medium tabular-nums">
                  {formatWei(bnb ?? 0n)} BNB
                  {spendUsd8 != null ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {t('usdApprox', { value: formatUsd(spendUsd8) })}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t('reviewReceive')}</dt>
                <dd className="text-right font-medium tabular-nums">
                  {formatWei(oknPreview)} $OKN
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t('reviewRate')}</dt>
                <dd className="text-right tabular-nums">
                  {t('rateValue', { value: formatWei(rate) })}
                  {pricePerOknUsd8 != null ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {t('pricePerOkn', { value: formatUsd(pricePerOknUsd8) })}
                    </span>
                  ) : null}
                </dd>
              </div>
              {allowanceAfter != null ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t('reviewAllowance')}</dt>
                  <dd className="text-right tabular-nums">{formatWei(allowanceAfter)} BNB</dd>
                </div>
              ) : null}
            </dl>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="mt-0.5 size-3.5 shrink-0" />
              {t('reviewRateNote')}
            </p>
            {rateChanged ? (
              <p
                role="status"
                className="flex items-start gap-1.5 rounded-ios-lg border border-ios-orange/30 bg-ios-orange/5 p-3 text-xs text-ios-orange"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {t('rateChanged')}
              </p>
            ) : null}
            {pendingHash ? (
              <div className="flex items-start gap-2 rounded-ios-lg border border-ios-blue/30 bg-ios-blue/5 p-3 text-sm">
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-ios-blue" />
                <div className="space-y-0.5">
                  <p className="font-medium">{t('pendingTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('pendingDesc')}</p>
                  <a
                    href={explorerTxUrl(pendingHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-ios-blue underline"
                  >
                    {t('viewTx')}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={confirming || isPending}
                className="w-full cursor-pointer sm:w-auto"
              >
                <ArrowLeft data-icon="inline-start" />
                {t('btnBack')}
              </Button>
              <Button onClick={onConfirm} disabled={!canBuy} className="w-full cursor-pointer flex-1">
                {isPending || confirming ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <ShoppingCart data-icon="inline-start" />
                )}
                {confirming ? t('btnConfirming') : isPending ? t('btnPending') : t('btnConfirm')}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Edit step */}
            <div className="space-y-2">
              <Label htmlFor="bnb-amount">{t('amountLabel')}</Label>
              <div className="relative">
                <Input
                  id="bnb-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={t('amountPlaceholder')}
                  value={amount}
                  aria-invalid={invalid || overCap || blockReason !== null || undefined}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErr(null);
                  }}
                  className="pr-16"
                />
                {showMax ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onMax}
                    className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 cursor-pointer px-3 text-xs font-semibold"
                    aria-label={t('maxAriaLabel')}
                  >
                    {t('maxButton')}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-muted-foreground tabular-nums">
                  {t('youReceive', { value: formatWei(oknPreview) })}
                  {pricePerOknUsd8 != null ? (
                    <span className="ml-1.5">
                      {t('pricePerOkn', { value: formatUsd(pricePerOknUsd8) })}
                    </span>
                  ) : null}
                </p>
                {minPurchase > 0n ? (
                  <p className="text-muted-foreground tabular-nums">
                    {minPurchaseUsd !== null
                      ? t('minNoteUsd', {
                          usd: `$${minPurchaseUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
                          bnb: formatWei(minPurchase),
                        })
                      : t('minNote', { value: formatWei(minPurchase) })}
                  </p>
                ) : null}
              </div>
              {/* Gap 2: approx USD for the entered amount + feed freshness. */}
              {spendUsd8 != null && bnb != null && bnb > 0n ? (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t('usdApprox', { value: formatUsd(spendUsd8) })}
                  {bnbUsdStale ? (
                    <span className="ml-2 text-ios-orange">{t('priceStale')}</span>
                  ) : priceAgeSeconds != null ? (
                    <span className="ml-2">{t('priceUpdated', { seconds: priceAgeSeconds })}</span>
                  ) : null}
                </p>
              ) : null}
              {invalid ? (
                <FieldError message={t('errInvalid')} />
              ) : overCap ? (
                <FieldError
                  message={t('errOverCap', { value: formatWei(remaining ?? 0n) })}
                />
              ) : blockReason !== null ? (
                <FieldError message={blockMessage(blockReason)} />
              ) : null}
              {maxBnb !== null && maxBnb > 0n && saleAvailable && !overCap ? (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t('maxNote', { value: formatWei(maxBnb) })}
                </p>
              ) : null}
            </div>

            {!address ? (
              <InlineNote>{t('connectNote')}</InlineNote>
            ) : draftLocked ? (
              <InlineNote>{t('saleDraft')}</InlineNote>
            ) : paused ? (
              <InlineNote>{t('salePaused')}</InlineNote>
            ) : null}

            {/* Disconnected: connecting is the action this card needs, so it
                takes the primary slot (the Buy button returns once a wallet
                is connected). The connect flow lives on the wallet page. */}
            {!address ? (
              <Button asChild className="w-full cursor-pointer sm:w-auto">
                <Link href="/app/wallet">
                  <Wallet data-icon="inline-start" />
                  {t('connectCta')}
                </Link>
              </Button>
            ) : (
              // Gap 5: [Buy] opens the in-app review step; the wallet popup only
              // opens after Confirm.
              <Button onClick={onReview} disabled={!canBuy} className="w-full cursor-pointer sm:w-auto">
                <ShoppingCart data-icon="inline-start" />
                {t('btnIdle')}
              </Button>
            )}
          </>
        )}

        {err ? (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {err}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}

function InlineNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
      {children}
    </p>
  );
}
