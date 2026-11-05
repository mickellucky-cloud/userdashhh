import { defineChain } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';

// Re-export viem chain definitions so apps can import from one place.
export { bsc, bscTestnet };

// Canonical chain config (plan §9)
export const BSC_MAINNET = {
  chainId: 56,
  chain: bsc,
  rpcUrl: process.env.BSC_RPC_URL ?? 'https://bsc-dataseed.binance.org',
  explorerUrl: 'https://bscscan.com',
  label: 'BSC Mainnet',
} as const;

export const BSC_TESTNET = {
  chainId: 97,
  chain: bscTestnet,
  rpcUrl:
    process.env.BSC_TESTNET_RPC_URL ??
    'https://data-seed-prebsc-1-s1.binance.org:8545',
  explorerUrl: 'https://testnet.bscscan.com',
  label: 'BSC Testnet',
} as const;

export const SUPPORTED_CHAINS = [BSC_MAINNET, BSC_TESTNET] as const;

// === CANONICAL DEPLOYED ADDRESSES ===
export const CANONICAL_CONTRACTS_MAINNET = {
  oknToken: '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377',
  merkleDistributor: '0xC0e7a1cEB339B7a35Af81D2AE7705f7d8456C4a9',
  tokenSale: '0x46fC09a84C23c94Ea6853450253C050be44dB751',
  teamVesting: '0x0ce655e5965a1661629A975b79f7E7f252ed3F74',
} as const;

export const CANONICAL_CONTRACTS_TESTNET = {
  oknToken: '0xfaA8911dFD487452B7a05f1cDBEFdC4456115a83',
  merkleDistributor: '0xC5638E652321C429f81438c29bC220280F131409',
  tokenSale: '0x6c3bDE2a0d07E288B72580D3717B0B807ffcb73c',
  teamVesting: '0x70059a91cAc5d4C975813020da39112f8ef5e1b8',
} as const;

/**
 * Returns true if running in development / testnet mode.
 * Single switch: NODE_ENV === 'development' automatically routes to BSC Testnet (chain 97).
 * NODE_ENV === 'production' routes to BSC Mainnet (chain 56).
 * Explicit NEXT_PUBLIC_BSC_CHAIN_ID overrides take precedence when provided.
 */
export function isTestnetMode(): boolean {
  const envVal = (
    process.env.NEXT_PUBLIC_NODE_ENV ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    'production'
  ).toLowerCase();

  // Single-switch: NODE_ENV === 'development' or 'testnet' triggers testnet mode
  if (envVal === 'development' || envVal === 'testnet') return true;
  if (process.env.NETWORK_MODE === 'testnet') return true;

  // Otherwise respect explicit chain id if provided
  if (process.env.NEXT_PUBLIC_BSC_CHAIN_ID === '97') return true;
  return false;
}

export function getActiveContracts() {
  return isTestnetMode() ? CANONICAL_CONTRACTS_TESTNET : CANONICAL_CONTRACTS_MAINNET;
}

// === CONTRACT ADDRESSES (populated after deploy) ===
// Automatically defaults to canonical addresses based on NODE_ENV (development -> testnet, production -> mainnet).
// Explicit NEXT_PUBLIC_* variables can still override when set.
export const CONTRACTS = {
  oknToken: (isTestnetMode() ? CANONICAL_CONTRACTS_TESTNET.oknToken : (process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS || CANONICAL_CONTRACTS_MAINNET.oknToken)) as `0x${string}`,
  merkleDistributor: (isTestnetMode() ? CANONICAL_CONTRACTS_TESTNET.merkleDistributor : (process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS || CANONICAL_CONTRACTS_MAINNET.merkleDistributor)) as `0x${string}`,
  tokenSale: (isTestnetMode() ? CANONICAL_CONTRACTS_TESTNET.tokenSale : (process.env.NEXT_PUBLIC_TOKEN_SALE_ADDRESS || CANONICAL_CONTRACTS_MAINNET.tokenSale)) as `0x${string}`,
  teamVesting: (isTestnetMode() ? CANONICAL_CONTRACTS_TESTNET.teamVesting : (process.env.NEXT_PUBLIC_TEAM_VESTING_ADDRESS || CANONICAL_CONTRACTS_MAINNET.teamVesting)) as `0x${string}`,
} as const;

// === CHAINLINK PRICE FEEDS ===
// BNB/USD feed, 8 decimals. Used by MerkleDistributor for the BNB claim fee.
// Casing MUST be the exact EIP-55 checksum — viem rejects miscased addresses
// at call time (the testnet feed shipped miscased and every testnet BNB/USD
// read failed until this was fixed; see __tests__/chainlink-feeds.test.ts).
export const CHAINLINK_FEEDS = {
  bnbUsdMainnet: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
  bnbUsdTestnet: '0x2514895C72f50d8Bd4b4f9B1110F45d1d145c4C3',
} as const;

export function getChainlinkFeed(chainId: number): `0x${string}` {
  // F34: unknown chain ids used to silently resolve to the TESTNET feed —
  // a misconfigured chain read the wrong oracle with no error. Fail loudly.
  if (chainId !== 56 && chainId !== 97) {
    throw new Error(
      `No Chainlink BNB/USD feed configured for chainId ${chainId} (expected 56 or 97)`,
    );
  }
  return (chainId === 56
    ? CHAINLINK_FEEDS.bnbUsdMainnet
    : CHAINLINK_FEEDS.bnbUsdTestnet) as `0x${string}`;
}

export const APP_CONFIG = {
  chainId: isTestnetMode() ? 97 : Number(process.env.NEXT_PUBLIC_BSC_CHAIN_ID ?? 56),
  // F20: derived from the chain by default (a chainId/explorer mismatch made
  // every tx link 404); an explicit NEXT_PUBLIC_BSC_EXPLORER still overrides.
  explorerUrl: isTestnetMode()
    ? 'https://testnet.bscscan.com'
    : (process.env.NEXT_PUBLIC_BSC_EXPLORER ?? 'https://bscscan.com'),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME ?? '',
  telegramLoginDomain: process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_DOMAIN ?? '',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
} as const;

/**
 * Read the configured chainId LIVE from the env (not the cached APP_CONFIG
 * constant). APP_CONFIG.chainId is captured once at module import, which is
 * correct for client bundles (the env is fixed at build/runtime) but wrong for
 * server routes in tests, where vi.stubEnv changes NEXT_PUBLIC_BSC_CHAIN_ID
 * after the module is imported. Server-side signature checks use this so the
 * expected chainId always reflects the current env value.
 */
export function getConfiguredChainId(): number {
  if (isTestnetMode()) return 97;
  if (process.env.NEXT_PUBLIC_BSC_CHAIN_ID) {
    return Number(process.env.NEXT_PUBLIC_BSC_CHAIN_ID);
  }
  return 56;
}

// === TOKEN CONSTANTS (must match OKNToken.sol) ===
export const TOKEN_CONSTANTS = {
  name: 'OKN Token',
  symbol: '$OKN', // matches the on-chain symbol in OKNToken.sol constructor
  decimals: 18,
  maxSupply: 5_000_000_000n * 10n ** 18n, // 5 billion
  communityCap: 1_750_000_000n * 10n ** 18n, // 35%
  publicSaleCap: 1_250_000_000n * 10n ** 18n, // 25%
  initialMint: 2_000_000_000n * 10n ** 18n, // 40%
} as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export function getChain(chainId: number): SupportedChain | undefined {
  return SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
}

export function explorerTxUrl(txHash: string, explorerUrl = APP_CONFIG.explorerUrl): string {
  return `${explorerUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string, explorerUrl = APP_CONFIG.explorerUrl): string {
  return `${explorerUrl}/address/${address}`;
}

// Convenience for custom chain config in wagmi
export function wagmiChain(chainId: number) {
  return defineChain({
    ...getChain(chainId)?.chain ?? bsc,
  });
}

// === BSC NATIVE USDC (Circle) ===
// The connected-wallet rail for copier PRO charges pays with USDC on the
// configured BSC chain. BSC testnet has no canonical Circle deployment, so
// testnet billing must set NEXT_PUBLIC_BSC_USDC_ADDRESS explicitly.
export const BSC_USDC_ADDRESS = (process.env.NEXT_PUBLIC_BSC_USDC_ADDRESS ??
  '0x8AC76a51cc950d9822D68b83fe1Ad97B32Cd580d') as `0x${string}`;
