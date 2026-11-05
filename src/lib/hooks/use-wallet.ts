/**
 * lib/hooks/use-wallet.ts — Phase 4 + 6.11
 * wagmi hooks wrapped for OKN-specific reads (token balance, sale status).
 *
 * wagmi v2's useReadContract returns data as `readonly unknown[]` in some overloads;
 * we cast to bigint for our read-only scalar contract calls.
 */
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { merkleDistributorAbi, oknTokenAbi, tokenSaleAbi, CONTRACTS, buildRebindMessage, buildUnbindMessage, APP_CONFIG } from '@okn/shared';
import { useMemo } from 'react';
import { api, type RebindRequestInput } from '../api/client';

function asBigInt(data: unknown): bigint | undefined {
  return typeof data === 'bigint' ? data : undefined;
}
function asBool(data: unknown): boolean | undefined {
  return typeof data === 'boolean' ? data : undefined;
}

export function useOknBalance() {
  const { address } = useAccount();
  const result = useReadContract({
    address: CONTRACTS.oknToken,
    abi: oknTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { ...result, data: asBigInt(result.data) };
}

/**
 * F01 — the exact BNB fee the distributor will require for claim(). The claim
 * button sends this as msg.value verbatim (the contract keeps any excess, so
 * never round up). Refetched on window focus and on demand (fee moves with
 * the BNB/USD feed).
 */
export function useRequiredFeeBnb() {
  const result = useReadContract({
    address: CONTRACTS.merkleDistributor,
    abi: merkleDistributorAbi,
    functionName: 'getRequiredFeeBnb',
    query: {
      enabled: !!CONTRACTS.merkleDistributor,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  });
  return { ...result, data: asBigInt(result.data) };
}

export function useSaleStatus() {
  const rate = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'rate',
  });
  const cap = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'capPerWallet',
  });
  const paused = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'paused',
  });
  const raised = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'totalBnbRaised',
  });
  // F04 — the contract enforces the window, the minimum, and the hard cap;
  // the buy UI must gate on the same values it reads.
  const saleStart = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'saleStart',
  });
  const saleEnd = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'saleEnd',
  });
  const minPurchase = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'minPurchase',
  });
  const bnbHardCap = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'bnbHardCap',
  });
  return useMemo(
    () => ({
      rate: asBigInt(rate.data),
      capPerWallet: asBigInt(cap.data),
      paused: asBool(paused.data),
      totalBnbRaised: asBigInt(raised.data),
      saleStart: asBigInt(saleStart.data),
      saleEnd: asBigInt(saleEnd.data),
      minPurchase: asBigInt(minPurchase.data),
      bnbHardCap: asBigInt(bnbHardCap.data),
      isLoading:
        rate.isLoading ||
        cap.isLoading ||
        paused.isLoading ||
        raised.isLoading ||
        saleStart.isLoading ||
        saleEnd.isLoading ||
        minPurchase.isLoading ||
        bnbHardCap.isLoading,
    }),
    [rate, cap, paused, raised, saleStart, saleEnd, minPurchase, bnbHardCap],
  );
}

export function usePurchasedAmount() {
  const { address } = useAccount();
  const result = useReadContract({
    address: CONTRACTS.tokenSale,
    abi: tokenSaleAbi,
    functionName: 'purchased',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { ...result, data: asBigInt(result.data) };
}

/**
 * Buy-page progress (gap 6): the $OKN still mintable by the public sale.
 * OKNToken.saleRemaining() is the authoritative headroom (PUBLIC_SALE_CAP
 * minus saleMinted, maintained by the token contract itself).
 */
export function useSaleRemaining() {
  const result = useReadContract({
    address: CONTRACTS.oknToken,
    abi: oknTokenAbi,
    functionName: 'saleRemaining',
  });
  return { ...result, data: asBigInt(result.data) };
}

/**
 * Phase 6.11 (Q-G) — submit a wallet rebind request.
 *
 * The hook signs a deterministic challenge with the NEW connected wallet via
 * wagmi's useSignMessage (EIP-191 personal_sign), then POSTs {newWallet,
 * signature, message, reason} to /api/wallet/rebind. The server verifies the
 * signature with viem.verifyMessage.
 *
 * The message embeds the new wallet + ISO timestamp to bind the signature to
 * its context (replay protection on top of the 30-day cooldown).
 */
export function useSubmitRebind() {
  const { signMessageAsync } = useSignMessage();
  return useMutation({
    mutationFn: async (input: {
      newWallet: `0x${string}`;
      reason: RebindRequestInput['reason'];
    }) => {
      const message = buildRebindMessage(input.newWallet, new Date().toISOString(), APP_CONFIG.chainId);
      const signature = await signMessageAsync({ message });
      return api.submitRebindRequest({
        newWallet: input.newWallet,
        signature,
        message,
        reason: input.reason,
      });
    },
  });
}

/**
 * Self-service wallet unbind (disconnect).
 *
 * Signs a deterministic challenge with the wallet CURRENTLY BOUND to the user
 * (via wagmi's useSignMessage, EIP-191 personal_sign), then POSTs
 * { message, signature } to /api/wallet/unbind. The server derives the bound
 * address from the DB and verifies the signature against it — so this only
 * succeeds when the connected wallet in the browser matches the bound wallet.
 *
 * The bound address must be supplied by the caller (read from the /me cache);
 * the message embeds it + a timestamp for replay protection.
 *
 * On success the caller should invalidate ['me'] so the dashboard reflects the
 * unbound state (and the bind flow becomes available again).
 */
export function useUnbindWallet() {
  const { signMessageAsync } = useSignMessage();
  return useMutation({
    mutationFn: async (input: { boundWallet: `0x${string}` }) => {
      const message = buildUnbindMessage(input.boundWallet, Date.now(), APP_CONFIG.chainId);
      const signature = await signMessageAsync({ message });
      return api.unbindWallet({ message, signature });
    },
  });
}
