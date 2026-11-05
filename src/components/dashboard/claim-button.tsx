'use client';

/**
 * dashboard/claim-button.tsx — claim flow card.
 *
 * Reads the latest committed root version from /api/claims, then fetches the
 * caller's Merkle proof for that root and calls
 * distributor.claim(account, cumulativeAmount, proof) via wagmi.
 *
 * Production hardening (remediation F01/F02/F03/F05):
 *   - the tx names the BOUND wallet from the proof (never the merely
 *     connected one) and is blocked upfront when they differ;
 *   - msg.value is the EXACT on-chain required fee (no buffer — the contract
 *     keeps the excess) and blocks while the fee is unreadable;
 *   - the write is chain-guarded (prompt a network switch, never broadcast on
 *     a foreign chain) and pinned to the configured chainId;
 *   - success is only shown after the receipt confirms on-chain; reverts are
 *     decoded to friendly copy instead of a generic failure.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { AlertCircle, Gift, Loader2, Wallet } from 'lucide-react';
import { merkleDistributorAbi, CONTRACTS, APP_CONFIG, explorerTxUrl } from '@okn/shared';
import { useClaimEligibility, useClaimProof } from '@/lib/hooks/use-claim';
import { useOknBalance, useRequiredFeeBnb } from '@/lib/hooks/use-wallet';
import { useChainGuard } from '@/lib/hooks/use-chain-guard';
import {
  resolveClaimTarget,
  buildClaimValue,
  ClaimCallError,
} from '@/lib/claim-call';
import { decodeChainError, isUserRejection } from '@/lib/chain-errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { formatWei, shortAddress } from '@/lib/utils';

export function ClaimButton() {
  const t = useTranslations('dashboard.claimButton');
  const tToast = useTranslations('toasts.claim');
  const { address } = useAccount();
  const { toast } = useToast();
  const qc = useQueryClient();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { data: eligibility } = useClaimEligibility();
  const balance = useOknBalance();
  const feeQuery = useRequiredFeeBnb();
  const guard = useChainGuard();
  const [err, setErr] = useState<string | null>(null);
  // True from broadcast until the receipt lands (wallet prompt → confirmation).
  const [confirming, setConfirming] = useState(false);

  // Prove against the latest committed root. Null while no root has been
  // committed; useClaimProof self-disables in that case.
  const latestRootVersion = eligibility?.latestRootVersion ?? null;
  const proofQuery = useClaimProof(latestRootVersion);
  const proof = proofQuery.data ?? null;

  let entitlement = 0n;
  try {
    entitlement = proof ? BigInt(proof.cumulativeEntitlement) : 0n;
  } catch {
    entitlement = 0n;
  }

  function claimCallErrorMessage(e: ClaimCallError): string {
    switch (e.code) {
      case 'not_connected':
        return t('errNotConnected');
      case 'no_bound_wallet':
        return t('errNotOpen');
      case 'wrong_wallet':
        return t('errWrongWallet', { wallet: shortAddress(e.expected ?? '') });
      case 'fee_unavailable':
        return t('errFeeUnavailable');
    }
  }

  const onClaim = async () => {
    setErr(null);
    try {
      // F02: the proof names the bound wallet — the tx must claim as THAT
      // account, and a connected≠bound mismatch never reaches the chain.
      const account = resolveClaimTarget({
        connected: address,
        bound: (proof?.account ?? null) as `0x${string}` | null,
      });
      if (!proof || entitlement <= 0n) {
        return setErr(t('errNotOpen'));
      }
      // F01: exact fee as msg.value (blocks while unreadable).
      const value = buildClaimValue(feeQuery.data);
      // F03: never broadcast on a foreign chain.
      await guard.ensureCorrectChain();

      const hash = await writeContractAsync({
        address: CONTRACTS.merkleDistributor,
        abi: merkleDistributorAbi,
        functionName: 'claim',
        args: [account, entitlement, proof.proof as `0x${string}`[]],
        value,
        chainId: APP_CONFIG.chainId,
      });
      setConfirming(true);

      // F03: wait for the receipt — "submitted" is not "succeeded". A revert
      // here surfaces the decoded reason instead of a false success toast.
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
      });
      if (receipt.status !== 'success') {
        throw new Error('Claim transaction reverted on-chain.');
      }

      toast({
        title: tToast('submittedTitle'),
        description: (
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="text-ios-blue underline"
          >
            {tToast('submittedDescLink')}
          </a>
        ),
      });
      // Refresh the dependent caches AFTER confirmation so the UI reflects
      // the mined state, not the pre-tx state.
      void qc.invalidateQueries({ queryKey: ['claim-eligibility'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['portfolio'] });
      void balance.refetch();
    } catch (e) {
      if (e instanceof ClaimCallError) {
        setErr(claimCallErrorMessage(e));
      } else {
        setErr(
          isUserRejection(e) ? t('errRejected') : decodeChainError(e, t('errFailed')),
        );
      }
    } finally {
      setConfirming(false);
    }
  };

  const busy = isPending || confirming;
  const feeNote =
    feeQuery.data !== undefined
      ? t('feeNote', {
          value: Number(formatEther(feeQuery.data)).toFixed(6).replace(/\.?0+$/, ''),
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {proofQuery.isLoading
            ? t('descLoading')
            : proof && entitlement > 0n
              ? t('descClaimable', { value: formatWei(entitlement) })
              : t('descNotOpen')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {proofQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : proofQuery.isError ? (
          <div className="flex items-start gap-2 rounded-lg border border-ios-orange/30 bg-ios-orange/10 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-ios-orange" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t('notOpenTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('notOpenBody')}
              </p>
            </div>
          </div>
        ) : proof && entitlement <= 0n ? (
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/50 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {t('noBalanceBody')}
            </p>
          </div>
        ) : null}

        {!address ? (
          <>
            <p className="text-xs text-muted-foreground">{t('connectNote')}</p>
            {/* Connecting is the action this card needs, so it takes the
                primary slot (the Claim button returns once a wallet is
                connected). The connect flow lives on the wallet page. */}
            <Button asChild className="w-full cursor-pointer">
              <Link href="/app/wallet">
                <Wallet data-icon="inline-start" />
                {t('connectCta')}
              </Link>
            </Button>
          </>
        ) : (
          <Button
            onClick={onClaim}
            disabled={busy || !address || !proof || entitlement <= 0n || feeQuery.data === undefined}
            className="w-full cursor-pointer"
          >
            {busy ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Gift data-icon="inline-start" />
            )}
            {confirming ? t('btnConfirming') : isPending ? t('btnPending') : t('btnIdle')}
          </Button>
        )}

        {feeNote ? (
          <p className="text-xs text-muted-foreground tabular-nums">{feeNote}</p>
        ) : null}

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
