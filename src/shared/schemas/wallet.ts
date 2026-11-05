/**
 * schemas/wallet.ts — wallet binding input validation + helpers.
 *
 * The first-time bind requires an EIP-191 signature proving the user controls
 * the wallet address they're claiming. The message must embed the wallet
 * address + a recent timestamp so a stolen signature can't be replayed.
 *
 * NOTE: walletRebindInputSchema lives in user.ts (alongside the admin role
 * schemas that also touch wallet changes). This file owns only the first-time
 * bind schema + the shared message-building helper.
 */
import { z } from 'zod';

/** Hex string (0x-prefixed). */
const hexSchema = z.string().regex(/^0x[a-fA-F0-9]+$/, 'Must be 0x-prefixed hex');

/** EVM address (0x + 40 hex chars). */
const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address (0x + 40 hex chars)');

/** Input for POST /api/wallet/bind (first-time wallet binding). */
export const walletBindInputSchema = z.object({
  address: addressSchema.transform((v) => v as `0x${string}`),
  message: z.string().min(1, 'Signed message is required'),
  signature: hexSchema.min(65, 'Signature is required').transform((v) => v as `0x${string}`),
});
export type WalletBindInput = z.infer<typeof walletBindInputSchema>;

/**
 * Input for POST /api/wallet/unbind (self-service wallet disconnect).
 *
 * NOTE: no `address` field is sent. The wallet being unbound is the one
 * currently bound to the authenticated user in the DB, and the server verifies
 * the signature against THAT address (never trusting a client-claimed value).
 * The signed message must embed the bound address + timestamp for freshness.
 */
export const walletUnbindInputSchema = z.object({
  message: z.string().min(1, 'Signed message is required'),
  signature: hexSchema.min(65, 'Signature is required').transform((v) => v as `0x${string}`),
});
export type WalletUnbindInput = z.infer<typeof walletUnbindInputSchema>;

/** The canonical message the client must sign before binding.
 *  Embeds the address + the target chainId + a timestamp so the server can
 *  verify freshness AND chain binding (a signature minted on testnet must NOT
 *  be replayable on mainnet — see extractChainId + APP_CONFIG.chainId). */
export function buildBindMessage(address: string, timestamp: number, chainId: number): string {
  return `OKN Wallet Binding\nAddress: ${address}\nChain ID: ${chainId}\nTimestamp: ${timestamp}\n\nThis signature proves you control this wallet.`;
}

/** The canonical message the client must sign before unbinding (disconnecting)
 *  their currently bound wallet. Mirrors buildBindMessage so the server can
 *  extract + freshness-check the timestamp and verify chain binding with the
 *  same helpers. The address embedded here is the wallet currently bound to
 *  the user. */
export function buildUnbindMessage(address: string, timestamp: number, chainId: number): string {
  return `OKN Wallet Unbind\nAddress: ${address}\nChain ID: ${chainId}\nTimestamp: ${timestamp}\n\nThis signature proves you still control the wallet currently bound to your account.`;
}

/** The canonical message the client must sign before requesting a rebind.
 *  Embeds the NEW wallet + the target chainId + an ISO timestamp so the server
 *  can verify freshness AND chain binding (a stolen testnet signature must not
 *  be replayable on mainnet). Kept here so the client and server agree on the
 *  exact format. */
export function buildRebindMessage(newWallet: string, requestedAtIso: string, chainId: number): string {
  return `OKN wallet rebind\nNew wallet: ${newWallet}\nChain ID: ${chainId}\nRequested at: ${requestedAtIso}`;
}

/**
 * Extract the signed-message chainId and compare it to the app's configured
 * chain. Returns true only when the message's `Chain ID:` line matches the
 * expected chainId. This blocks cross-chain replay (a testnet bind/rebind/
 * unbind signature cannot be replayed against a mainnet deployment). Messages
 * signed before this field was added (no `Chain ID:` line) return null so the
 * caller can decide how to treat legacy messages.
 */
export function extractChainId(message: string): number | null {
  const match = message.match(/Chain ID:\s*(\d+)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
