/**
 * lib/buy-guard.ts — client-side buy-flow protection helpers.
 *
 * Pure module: no wagmi, no network. viem is imported only for error-class
 * detection and log decoding (both deterministic, unit-testable).
 *
 *   - hasRateChanged: rate-change protection. TokenSale.buy() has no minOut
 *     parameter, so the web layer closes the gap: the review step snapshots
 *     the rate used for the quote and the exact same comparison re-runs right
 *     before broadcasting. A changed rate aborts the send and re-quotes.
 *   - isReceiptTimeout: detects viem's WaitForTransactionReceiptTimeoutError
 *     so a slow-mining tx flips to a persistent "still pending" state (with
 *     an explorer link) instead of a dead-end error.
 *   - decodeBoughtFromReceipt: pulls the ACTUAL Bought amounts out of the
 *     confirmed receipt logs (preview numbers are only estimates).
 *   - mergePurchaseRows: history merge that renders optimistic "indexing"
 *     rows and de-duplicates by txHash once the indexer row arrives.
 */
import { parseEventLogs, WaitForTransactionReceiptTimeoutError } from 'viem';
import type { Log } from 'viem';
import { tokenSaleAbi } from '@okn/shared';

/**
 * True when the live rate differs from the review-time snapshot. Nullish on
 * either side means "cannot determine" (dev DB fallback or a failed re-read)
 * and returns false: never block a buyer on missing data — the contract
 * enforces the real rate regardless.
 */
export function hasRateChanged(
  snapshot: bigint | null | undefined,
  current: bigint | null | undefined,
): boolean {
  if (snapshot == null || current == null) return false;
  return snapshot !== current;
}

/**
 * Did the receipt wait time out? viem's typed error carries its own name, but
 * the name check keeps detection working when errors are cloned/serialized
 * across boundaries (React Query, logging wrappers).
 */
export function isReceiptTimeout(err: unknown): boolean {
  if (err instanceof WaitForTransactionReceiptTimeoutError) return true;
  if (err != null && typeof err === 'object') {
    return (err as { name?: unknown }).name === 'WaitForTransactionReceiptTimeoutError';
  }
  return false;
}

export interface DecodedBought {
  buyer: string;
  bnbAmount: bigint;
  oknAmount: bigint;
  rate: bigint;
}

/**
 * Decode the TokenSale Bought event from a confirmed receipt's logs.
 * Returns null when no Bought event is present (defensive: success states
 * fall back to the previewed amount rather than crashing).
 */
export function decodeBoughtFromReceipt(receipt: { logs: readonly unknown[] }): DecodedBought | null {
  const bought = parseEventLogs({
    abi: tokenSaleAbi,
    logs: receipt.logs as unknown as Log[],
    eventName: 'Bought',
  }) as Array<{ args: { buyer?: string; bnbAmount?: bigint; oknAmount?: bigint; rate?: bigint } }>;
  const first = bought[0];
  if (!first?.args.bnbAmount || !first.args.oknAmount) return null;
  return {
    buyer: first.args.buyer ?? '',
    bnbAmount: first.args.bnbAmount,
    oknAmount: first.args.oknAmount,
    rate: first.args.rate ?? 0n,
  };
}

/**
 * A purchase row as rendered in the history table: either an API wire row
 * (numeric columns cross as strings) or an optimistic pending row (bigint,
 * in-memory only). Display helpers accept both.
 */
export interface PurchaseHistoryRow {
  id: string;
  bnbAmount: string | bigint;
  oknAmount: string | bigint;
  txHash: string;
  createdAt: string | Date;
  /** True on an optimistic row until the indexer row with the same txHash lands. */
  indexing?: boolean;
}

/**
 * Merge optimistic pending purchases ahead of the fetched rows. An optimistic
 * row is dropped as soon as a fetched row with the same txHash exists (case
 * insensitive), so the real indexed row replaces it — never a duplicate.
 */
export function mergePurchaseRows(
  optimistic: readonly PurchaseHistoryRow[],
  fetched: readonly PurchaseHistoryRow[],
): PurchaseHistoryRow[] {
  const indexed = new Set(fetched.map((r) => r.txHash.toLowerCase()));
  const pending = optimistic.filter((r) => !indexed.has(r.txHash.toLowerCase()));
  return [...pending, ...fetched];
}
