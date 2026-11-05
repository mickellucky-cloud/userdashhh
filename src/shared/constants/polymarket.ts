/**
 * Polymarket / Polygon constants for the copier service.
 *
 * Chain id 137 (Polygon PoS mainnet) is the only supported network; USDC.e
 * is the bridged USDC Polymarket settles in. The two exchange contracts are
 * where all CLOB fills settle: the standard CTF Exchange and the Neg Risk
 * CTF Exchange (used by multi-outcome markets). The detection tier watches
 * OrderFilled on both.
 */

export const POLYGON_CHAIN_ID = 137;

/** Bridged USDC (USDC.e) on Polygon mainnet — 6 decimals. */
export const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

/** Polymarket CTF Exchange (standard markets). */
export const POLYMARKET_CTF_EXCHANGE = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

/** Polymarket Neg Risk CTF Exchange (multi-outcome markets). */
export const POLYMARKET_NEG_RISK_CTF_EXCHANGE = '0xC5d563A36AE78145C45a50134d48A1215220f80a';

/** Polymarket exchange contracts, both watched for OrderFilled events. */
export const POLYMARKET_EXCHANGE_ADDRESSES = [
  POLYMARKET_CTF_EXCHANGE,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE,
] as const;

/** Polymarket CLOB REST host. */
export const POLYMARKET_CLOB_HOST = 'https://clob.polymarket.com';

/** Polymarket public data API (activity, positions). */
export const POLYMARKET_DATA_API_BASE = 'https://data-api.polymarket.com';

/** USDC has 6 decimals on Polygon. */
export const POLYGON_USDC_DECIMALS = 6;

/** Conditional tokens have 18 decimals on Polygon. */
export const POLYGON_CT_DECIMALS = 18;

/**
 * Human-readable ABI slice for the exchange OrderFilled event, used by the
 * copier detection tier to decode logs. VERIFY against mainnet before first
 * live use: run the tools/verify-abi probe and compare topic0 from an RPC
 * against this definition (see the runbook).
 */
export const POLYMARKET_ORDER_FILLED_ABI = [
  'event OrderFilled(address indexed maker, bytes32 indexed orderHash, uint256 makerAmountFilled, uint256 takerAmountFilled)',
] as const;
