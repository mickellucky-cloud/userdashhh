/**
 * lib/price-math.ts — pure USD↔BNB↔rate conversion math for USD-denominated
 * sale pricing.
 *
 * No side effects, no imports — usable from both the client (admin calculator
 * preview) and the server (sale-config route, rate-sync keeper). All math is
 * bigint so nothing depends on floating point except the explicit human-number
 * conversion helpers.
 *
 * Unit conventions (USD values use the Chainlink 8-decimal scale):
 *   - priceUsd8: USD per 1 $OKN, 8 decimals  ($0.05 → 5_000_000n)
 *   - bnbUsd8:   USD per 1 BNB, 8 decimals   ($604.32 → 60_432_000_000n)
 *   - rateWei:   TokenSale on-chain rate — $OKN wei per 1e18 BNB wei
 *                (the human "OKN per BNB" figure × 1e18)
 *
 * Derivations (see __tests__/price-math.test.ts for worked examples):
 *   rateWei   = (bnbUsd8  * 1e18) / priceUsd8
 *   priceUsd8 = (bnbUsd8  * 1e18) / rateWei
 */

const WEI_PER_UNIT = 10n ** 18n;
const BPS_SCALE = 10_000n;
const USD8_SCALE = 1e8;

function assertPositive(value: bigint, label: string): void {
  if (value <= 0n) {
    throw new RangeError(`${label} must be > 0 (got ${value.toString()})`);
  }
}

/** Human USD number → 8-decimal bigint. Rounds half away from zero. */
export function usdNumberTo8(usd: number): bigint {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new RangeError(`USD value must be a finite non-negative number (got ${usd})`);
  }
  return BigInt(Math.round(usd * USD8_SCALE));
}

/** 8-decimal bigint → human USD number (display only; never re-derive from it). */
export function usd8ToNumber(usd8: bigint): number {
  return Number(usd8) / USD8_SCALE;
}

/**
 * Fixed USD price per $OKN + live BNB/USD → the on-chain TokenSale rate.
 * Division truncates toward zero, which errs on the side of slightly MORE
 * tokens per BNB (buyer-favorable) and always satisfies the contract's
 * `rate > 0` requirement for sane inputs.
 */
export function usdToRateWei(priceUsd8: bigint, bnbUsd8: bigint): bigint {
  assertPositive(priceUsd8, 'USD price per token');
  assertPositive(bnbUsd8, 'BNB price');
  return (bnbUsd8 * WEI_PER_UNIT) / priceUsd8;
}

/** Current on-chain rate + live BNB/USD → the USD price it implies right now. */
export function rateWeiToImpliedUsd8(rateWei: bigint, bnbUsd8: bigint): bigint {
  assertPositive(rateWei, 'on-chain rate');
  assertPositive(bnbUsd8, 'BNB price');
  return (bnbUsd8 * WEI_PER_UNIT) / rateWei;
}

/**
 * Basis-point drift of the implied USD price vs the target USD price.
 * Positive = on-chain rate implies a HIGHER price than targeted (buyers pay
 * more); negative = buyers currently pay less than targeted.
 */
export function driftBps(targetUsd8: bigint, impliedUsd8: bigint): number {
  assertPositive(targetUsd8, 'target USD price');
  return Number(((impliedUsd8 - targetUsd8) * BPS_SCALE) / targetUsd8);
}

/**
 * Fixed USD minimum per purchase + live BNB/USD → the on-chain TokenSale
 * minimum (BNB wei). Division truncates toward zero, which errs toward a
 * slightly LOWER enforced minimum (buyer-favorable) — the same philosophy as
 * usdToRateWei.
 */
export function usdToMinWei(minUsd8: bigint, bnbUsd8: bigint): bigint {
  assertPositive(minUsd8, 'USD minimum');
  assertPositive(bnbUsd8, 'BNB price');
  return (minUsd8 * WEI_PER_UNIT) / bnbUsd8;
}

/** On-chain minimum (BNB wei) + live BNB/USD → the USD minimum it implies now. */
export function minWeiToImpliedUsd8(minWei: bigint, bnbUsd8: bigint): bigint {
  assertPositive(minWei, 'on-chain minimum');
  assertPositive(bnbUsd8, 'BNB price');
  return (minWei * bnbUsd8) / WEI_PER_UNIT;
}

/**
 * A BNB wei amount (a spend, not a minimum) + live BNB/USD → its USD value in
 * 8 decimals. Zero wei is a valid input (empty input field) and yields 0.
 * Truncation is display-only: the buy flow never sends a USD figure on-chain.
 */
export function bnbWeiToUsd8(bnbWei: bigint, bnbUsd8: bigint): bigint {
  if (bnbWei === 0n) return 0n;
  assertPositive(bnbWei, 'BNB amount');
  assertPositive(bnbUsd8, 'BNB price');
  return (bnbWei * bnbUsd8) / WEI_PER_UNIT;
}
