/**
 * lib/chain-errors.ts — friendly decoding of on-chain failures (F05).
 *
 * Money-moving writes (buy, claim) used to collapse every non-rejection
 * failure into "Transaction failed", hiding the exact reason the contract
 * reverted with. viem surfaces custom errors two ways: an `errorName`
 * property on ContractFunctionExecutionError, and the error name embedded in
 * the message of the wrapped revert. This decoder walks the cause chain and
 * matches KNOWN error names only — the returned copy never includes raw
 * revert args (no hex dumps, no wei numbers in user-facing text).
 *
 * Pure module: string/property walking only — SSR-safe, unit-testable.
 */

interface DecodingRules {
  /** Regex run against the concatenated cause-chain messages + errorName. */
  match: RegExp;
  /** Friendly copy shown to the user. */
  message: string;
}

const RULES: DecodingRules[] = [
  {
    match: /InsufficientFee/i,
    message: 'The network fee changed while confirming. Try again — the exact fee is re-checked each attempt.',
  },
  {
    match: /InvalidProof/i,
    message: 'This wallet is not eligible for a claim right now. Make sure you connected the wallet bound to your account.',
  },
  {
    match: /NothingNewToClaim/i,
    message: 'You have already claimed everything available to you.',
  },
  {
    match: /StalePrice/i,
    message: 'The BNB price feed is updating. Please try again in a moment.',
  },
  {
    match: /Sale not started/i,
    message: 'The sale has not started yet.',
  },
  {
    match: /Sale ended/i,
    message: 'The sale has ended.',
  },
  {
    match: /ExceedsBnbHardCap/i,
    message: 'This purchase would exceed the sale hard cap. Reduce the amount.',
  },
  {
    match: /ExceedsCapPerWallet/i,
    message: 'This purchase would exceed your wallet cap. Reduce the amount.',
  },
  {
    match: /Amount too small/i,
    message: 'The amount is too small. Enter a larger amount.',
  },
  {
    match: /AccessControlUnauthorizedAccount|OwnableUnauthorizedAccount/i,
    message: 'This action is temporarily unavailable on-chain. The team has been notified — please try again later.',
  },
];

/** Concatenate an error graph (message + errorName + cause chain) for matching. */
function collectErrorText(err: unknown, depth = 0): string {
  if (!err || depth > 5) return '';
  if (typeof err === 'string') return err;
  if (typeof err !== 'object') return String(err);
  const parts: string[] = [];
  const e = err as { message?: unknown; errorName?: unknown; cause?: unknown; shortMessage?: unknown; code?: unknown };
  if (typeof e.message === 'string') parts.push(e.message);
  if (typeof e.shortMessage === 'string') parts.push(e.shortMessage);
  if (typeof e.errorName === 'string') parts.push(e.errorName);
  // Wallets like MetaMask expose the rejection as a bare { code: 4001 } with
  // no message — include the code so rejection detection can match it.
  if (typeof e.code === 'number' || typeof e.code === 'string') parts.push(String(e.code));
  if (e.cause !== undefined && e.cause !== err) parts.push(collectErrorText(e.cause, depth + 1));
  return parts.join('\n');
}

/** Decode a wallet/chain failure into friendly copy. Unknown → fallback. */
export function decodeChainError(err: unknown, fallback = 'Transaction failed. Please try again.'): string {
  const text = collectErrorText(err);
  for (const rule of RULES) {
    if (rule.match.test(text)) return rule.message;
  }
  return fallback;
}

/** Did the user dismiss the wallet prompt? (Extended: code 4001 + "declined".) */
export function isUserRejection(err: unknown): boolean {
  const text = collectErrorText(err);
  if (/\b4001\b/.test(text)) return true;
  return /user rejected|rejected the request|user denied|user declined|denied transaction/i.test(text);
}
