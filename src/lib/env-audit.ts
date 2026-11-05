/**
 * lib/env-audit.ts — build-time guards for client-inlined env (F19).
 *
 * NEXT_PUBLIC_* values are INLINED into the client bundle at build time. A
 * missing variable used to ship as '' (cast to an address!) or a committed
 * dev WalletConnect projectId — silent breakage discovered by users. The
 * production build now FAILS with a list of the offending variables instead.
 *
 * Pure function so it is unit-testable; next.config.ts invokes it during
 * `next build` when NODE_ENV === 'production'.
 */

const ADDRESS_VARS = [
  'NEXT_PUBLIC_OKN_TOKEN_ADDRESS',
  'NEXT_PUBLIC_TOKEN_SALE_ADDRESS',
  'NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS',
] as const;

const REQUIRED_VARS = [
  ...ADDRESS_VARS,
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
] as const;

export function auditProductionEnv(
  env: Record<string, string | undefined>,
): string[] {
  const problems: string[] = [];

  const chainId = Number(env.NEXT_PUBLIC_BSC_CHAIN_ID ?? 56);
  if (chainId !== 56 && chainId !== 97) {
    problems.push(
      `NEXT_PUBLIC_BSC_CHAIN_ID must be 56 or 97 (got "${env.NEXT_PUBLIC_BSC_CHAIN_ID ?? 'unset, defaulting to 56'}")`,
    );
  }

  for (const name of REQUIRED_VARS) {
    if (!env[name]) {
      problems.push(`${name} is required in production builds (it is inlined into the client bundle)`);
    }
  }

  for (const name of ADDRESS_VARS) {
    const value = env[name];
    if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) {
      problems.push(`${name} must be a 0x-prefixed 20-byte address (got "${value}")`);
    }
  }

  return problems;
}
