/**
 * lib/chain-guard.ts — pure predicates for chain + sale gating (F03/F04).
 *
 * Both money-moving writes (buy, claim) check these BEFORE broadcasting so
 * the wallet never sends a transaction that is doomed (wrong chain, outside
 * the sale window, over the hard cap, below the minimum). Times from the
 * contracts are unix SECONDS; the caller passes `now` in seconds too.
 *
 * Pure module: no wagmi/viem imports — unit-testable and SSR-safe. The
 * interactive side (network switch prompt) is in use-chain-guard.ts.
 */

/** F03: is the connected wallet on the app's configured chain? */
export function isCorrectChain(
  connectedChainId: number | undefined,
  configuredChainId: number,
): boolean {
  return connectedChainId === configuredChainId;
}

export interface SaleStatusLike {
  paused?: boolean;
  /** Unix seconds; 0/undefined = no constraint. */
  saleStart?: bigint;
  saleEnd?: bigint;
  /** Wei; 0/undefined = no minimum. */
  minPurchase?: bigint;
  /** Wei; undefined = no cap. */
  bnbHardCap?: bigint;
  /** Wei raised so far. */
  totalBnbRaised?: bigint;
  /**
   * App-level visibility gate (sale_config.sale_mode, 0029 soft-launch flow).
   * 'draft' = private test phase: non-admin viewers are blocked in the app no
   * matter what the on-chain state says (admins may have unpaused the
   * contract for test buys). undefined = public, no app-level gate.
   */
  visibility?: 'draft' | 'public';
  /** True when the session viewer holds any users.adminRole (may test-buy in draft). */
  viewerIsSaleAdmin?: boolean;
  /** True when running in testnet mode (chainId 97), allowing test buys. */
  isTestnet?: boolean;
}

export type SaleBlockReason =
  | 'draft'
  | 'paused'
  | 'not-started'
  | 'ended'
  | 'hard-cap'
  | 'below-min';

/**
 * Buy-specific block reasons: the contract-mirroring sale checks PLUS the
 * client-only wallet-balance check. The contract cannot see the user's BNB
 * balance; the wallet simply fails the value transfer, so the UI checks it
 * AFTER all sale-state reasons to keep the contract-mirroring order intact.
 */
export type BuyBlockReason = SaleBlockReason | 'insufficient-balance';

/**
 * F04: why can this purchase NOT happen right now? Returns null when the
 * purchase is allowed. Mirrors TokenSale.buy()'s require() order so the UI
 * blocks exactly what the contract would revert — with ONE app-level check in
 * front: the draft visibility gate, which hides the sale from non-admins even
 * when the (test-unpaused) contract would accept their transaction.
 */
export function saleBlockReason(
  status: SaleStatusLike,
  bnbAmount: bigint,
  nowSeconds: number,
): SaleBlockReason | null {
  if (status.visibility === 'draft' && !status.viewerIsSaleAdmin && !status.isTestnet) return 'draft';
  if (status.paused) return 'paused';

  const start = status.saleStart ?? 0n;
  const end = status.saleEnd ?? 0n;
  if (start !== 0n && BigInt(nowSeconds) < start) return 'not-started';
  if (end !== 0n && BigInt(nowSeconds) > end) return 'ended';

  if (
    status.bnbHardCap !== undefined &&
    status.totalBnbRaised !== undefined &&
    status.totalBnbRaised + bnbAmount > status.bnbHardCap
  ) {
    return 'hard-cap';
  }

  const min = status.minPurchase ?? 0n;
  if (min > 0n && bnbAmount < min) return 'below-min';

  return null;
}

/**
 * Gap 4 — sale gating + a wallet-balance pre-check in one predicate.
 * `balance` is the connected wallet's native BNB (wei); undefined (read not
 * available yet) skips the check so an RPC blip never soft-locks the form.
 * Ordered strictly AFTER saleBlockReason: sale-state reasons always win.
 */
export function buyBlockReason(
  status: SaleStatusLike,
  bnbAmount: bigint,
  nowSeconds: number,
  balance?: bigint,
): BuyBlockReason | null {
  const saleReason = saleBlockReason(status, bnbAmount, nowSeconds);
  if (saleReason !== null) return saleReason;
  if (balance !== undefined && bnbAmount > balance) return 'insufficient-balance';
  return null;
}
