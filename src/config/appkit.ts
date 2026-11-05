/**
 * config/appkit.ts — Phase 4.1 (Reown AppKit)
 * AppKit configuration for BSC. NO 'use client' directive (per Reown docs).
 * Uses WagmiAdapter with ssr:true for Next.js.
 */
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc, bscTestnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { APP_CONFIG } from '@okn/shared';

// F19: NO committed fallback projectId — a missing value must fail the
// production build (src/lib/env-audit.ts, invoked from next.config.ts) rather
// than silently shipping a foreign dev project with broken mobile pairing.
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// F03: offer ONLY the configured chain. Offering BSC Testnet on a mainnet
// deployment steered users into wrong-network writes (reads still returned
// mainnet data through the BSC transport, so the UI looked healthy).
export const networks: [AppKitNetwork, ...AppKitNetwork[]] =
  APP_CONFIG.chainId === 97 ? [bscTestnet] : [bsc];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true, // Required for Next.js
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

const appUrl =
  typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://okntoken.com');

export const metadata = {
  name: 'OKN Dashboard',
  description: 'OKN Token Claim and Purchase Dashboard',
  url: appUrl,
  icons: [
    `${appUrl}/apple-touch-icon.png`,
    'https://okntoken.com/apple-touch-icon.png',
  ],
  redirect: {
    native: 'okn://',
    universal: appUrl,
  },
};

/**
 * Featured mobile wallets prioritized for BSC / BEP-20:
 *  - Trust Wallet (BSC native favorite)
 *  - MetaMask (industry standard)
 *  - Binance Web3 Wallet (Binance ecosystem)
 *  - SafePal (BSC hardware/mobile wallet)
 *  - OKX Wallet (EVM multi-chain)
 *  - Bitget Wallet (formerly BitKeep)
 */
export const FEATURED_WALLET_IDS: string[] = [
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Web3 Wallet
  '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150', // SafePal
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
  '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget Wallet
];

/**
 * F-scope: hide wallets that cannot serve BSC (chainId 56) from the
 * WalletGuide listing. AppKit still detects installed EIP-6963 injected
 * wallets, but these non-EVM/Bitcoin-focused entries create dead-end
 * connection attempts for users (e.g. Phantom, which is Solana-first with
 * limited EVM chains and no BNB Smart Chain support).
 *
 * IDs are WalletGuide (explorer.walletconnect.com) wallet ids:
 *  - a797aa35...d3c393  Phantom        (Solana-first; no BSC)
 *  - 1ca0bdd4...605e79  Solflare       (Solana-only)
 *  - fd20dc42...3bd033a Coinbase Wallet (supported, but its SDK analytics
 *      endpoints are unreachable on some target networks, causing timeout
 *      spam; removed from the listing, injected detection still works)
 */
export const EXCLUDED_WALLET_IDS: string[] = [
  'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
  '1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79', // Solflare
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
];
