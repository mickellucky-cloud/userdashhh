/**
 * lib/claim-call.ts — pure guards for the user claim write (F01/F02).
 *
 * The on-chain claim is the one call in the app that is BOTH payable (BNB fee)
 * and account-bound (the merkle proof names one specific wallet). Two classes
 * of guaranteed-revert mistakes were possible before this module:
 *   1. sending the tx from a connected wallet that is not the bound account
 *      (InvalidProof, funds spent on gas);
 *   2. sending no/incorrect msg.value (InsufficientFee — the fee must be the
 *      EXACT current getRequiredFeeBnb(); the contract keeps any excess).
 *
 * Pure module: no wagmi/viem imports — unit-testable and SSR-safe. The claim
 * button resolves these BEFORE writing anything to the chain.
 */

export type ClaimCallErrorCode =
  | 'not_connected'
  | 'no_bound_wallet'
  | 'wrong_wallet'
  | 'fee_unavailable';

export class ClaimCallError extends Error {
  constructor(
    public code: ClaimCallErrorCode,
    /** For wrong_wallet: the address the user must connect instead. */
    public expected?: `0x${string}`,
  ) {
    super(`claim-call:${code}`);
    this.name = 'ClaimCallError';
  }
}

/**
 * Resolve the account the claim tx must name: ALWAYS the bound wallet from
 * the server-generated proof. Throws ClaimCallError before any broadcast when
 * the connected wallet does not match (or nothing is connected / bound).
 */
export function resolveClaimTarget(input: {
  connected: `0x${string}` | undefined;
  bound: `0x${string}` | null | undefined;
}): `0x${string}` {
  if (input.connected === undefined) {
    throw new ClaimCallError('not_connected');
  }
  if (!input.bound) {
    throw new ClaimCallError('no_bound_wallet');
  }
  if (input.connected.toLowerCase() !== input.bound.toLowerCase()) {
    throw new ClaimCallError('wrong_wallet', input.bound);
  }
  return input.bound;
}

/**
 * The exact msg.value for claim(): the current on-chain required fee. No
 * buffer, no rounding up — the contract keeps the excess (no refund), so a
 * buffer would silently cost the user money. 0n is a valid value (fee
 * disabled); undefined means the fee could not be read and the write must
 * not happen yet.
 */
export function buildClaimValue(requiredFeeBnb: bigint | undefined): bigint {
  if (requiredFeeBnb === undefined) {
    throw new ClaimCallError('fee_unavailable');
  }
  return requiredFeeBnb;
}
