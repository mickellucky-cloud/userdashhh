/**
 * components/providers/appkit-init.tsx — AppKit initializer (client-only).
 *
 * Loaded via next/dynamic with ssr:false so @reown/appkit (Lit web components)
 * never enters the webpack server chunk — avoids ChunkLoadError corruption.
 *
 * Telemetry noise note:
 *   Reown's TelemetryController POSTs errors to a handful of analytics hosts
 *   (pulse.walletconnect.org and friends) with NO public option to disable it
 *   (the `features.analytics: false` flag only controls the in-UI analytics
 *   view, not the controller). On networks that block those hosts, every
 *   internal fetch failure cascades into a new telemetry attempt, producing
 *   the recurring "Analytics SDK: Failed to fetch" log. There's no React
 *   error to catch or toast — Reown logs it directly via console.error inside
 *   its own try/catch. So in dev we install a fetch guard that:
 *     1. Short-circuits known telemetry/analytics hosts with an empty 204,
 *        satisfying the SDK without touching the network.
 *     2. Catches `TypeError("Failed to fetch")` on cross-origin requests and
 *        converts them to 204s as well — covers any analytics endpoint we
 *        didn't enumerate, plus any other third-party host your network
 *        blocks. Same-origin requests (your own /api/* routes) are left
 *        untouched so real app errors still surface.
 *   Production is unaffected: the guard is never installed.
 */
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import {
  projectId,
  networks,
  wagmiAdapter,
  metadata,
  FEATURED_WALLET_IDS,
  EXCLUDED_WALLET_IDS,
} from '@/config/appkit';

let initialized = false;

/** Hosts that exist purely for Reown/WalletConnect telemetry/analytics.
 *  Short-circuited to 204 in dev with no network call. */
const SILENCED_HOSTS = [
  'pulse.walletconnect.org',
  'data.walletconnect.org',
  'analytics.walletconnect.com',
  'pulse.reown.com',
  'analytics.reown.com',
];

function isSilencedHost(url: string): boolean {
  return SILENCED_HOSTS.some((h) => url.includes(h));
}

/** Dev-only: stub telemetry fetches and swallow cross-origin network errors
 *  so the SDK stops logging "Failed to fetch" on networks that block hosts.
 *
 *  IMPORTANT: `original.call(window, ...)` — NOT `original(...)`. Calling
 *  window.fetch as a bare function (detached from its owner) throws
 *  "Illegal invocation" / TypeError in Chromium because the native method
 *  requires `this === window`. */
function installTelemetryGuard() {
  if (typeof window === 'undefined') return; // server-side fetch is left alone
  const original = window.fetch;
  const patchedFetch: typeof window.fetch = function patchedFetch(input, init) {
    let urlStr = '';
    try {
      urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
    } catch {
      // URL parsing failed — fall through to the real fetch below.
    }

    // 1) Known telemetry endpoints: resolve immediately with 204, no network.
    if (urlStr && isSilencedHost(urlStr)) {
      return Promise.resolve(
        new Response(null, { status: 204, statusText: 'No Content' }),
      );
    }

    // 2) Web3Modal getWallets endpoint in dev: return empty wallet list so 403 doesn't trigger reload loops
    if (urlStr && (urlStr.includes('api.web3modal.org') || urlStr.includes('api.web3modal.com'))) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: [], count: 0 }), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    // 2) Everything else: call the real fetch with correct `this` context.
    return original.call(window, input, init);
  };
  window.fetch = patchedFetch;
}

/**
 * Mobile Deep Link & Universal Link navigation helper.
 *
 * Checks if a URL is a mobile wallet redirection URI (custom scheme or WC URI).
 */
function isWalletUri(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('wc?uri=') ||
    url.startsWith('wc:') ||
    url.startsWith('metamask://') ||
    url.startsWith('trust://') ||
    url.startsWith('safepalwallet://') ||
    url.startsWith('bitkeep://') ||
    url.startsWith('okex://') ||
    url.startsWith('okxwallet://') ||
    url.startsWith('bnc://') ||
    url.startsWith('tpoutside://') ||
    url.startsWith('rainbow://') ||
    url.startsWith('rnbw://') ||
    url.includes('.app.link/wc') ||
    url.includes('link.trustwallet.com/wc') ||
    url.includes('link.safepal.io/wc')
  );
}

/**
 * Transforms custom URL schemes to universal links where available.
 * Universal links allow iOS and Android to directly open the native wallet app
 * without Safari/Chrome blocking them or requiring secondary window context.
 */
function toUniversalOrMobileUrl(url: string): string {
  if (!url) return url;

  // 1. MetaMask: metamask://wc?uri=... -> https://metamask.app.link/wc?uri=...
  if (url.startsWith('metamask://wc?uri=')) {
    return `https://metamask.app.link/wc?uri=${url.slice('metamask://wc?uri='.length)}`;
  }
  if (url.startsWith('metamask://')) {
    return `https://metamask.app.link/${url.slice('metamask://'.length)}`;
  }

  // 2. Trust Wallet: trust://wc?uri=... -> https://link.trustwallet.com/wc?uri=...
  if (url.startsWith('trust://wc?uri=')) {
    return `https://link.trustwallet.com/wc?uri=${url.slice('trust://wc?uri='.length)}`;
  }
  if (url.startsWith('trust://')) {
    return `https://link.trustwallet.com/${url.slice('trust://'.length)}`;
  }

  // 3. SafePal: safepalwallet://wc?uri=... -> https://link.safepal.io/wc?uri=...
  if (url.startsWith('safepalwallet://wc?uri=')) {
    return `https://link.safepal.io/wc?uri=${url.slice('safepalwallet://wc?uri='.length)}`;
  }

  // 4. Rainbow: rainbow:// or rnbw://
  if (url.startsWith('rainbow://wc?uri=')) {
    return `https://rnbwapp.com/wc?uri=${url.slice('rainbow://wc?uri='.length)}`;
  }
  if (url.startsWith('rnbw://wc?uri=')) {
    return `https://rnbwapp.com/wc?uri=${url.slice('rnbw://wc?uri='.length)}`;
  }

  // 5. Bitget Wallet: bitkeep://wc?uri=... -> https://bkcode.vip/wc?uri=...
  if (url.startsWith('bitkeep://wc?uri=')) {
    return `https://bkcode.vip/wc?uri=${url.slice('bitkeep://wc?uri='.length)}`;
  }

  // 6. Binance Web3 Wallet: bnc://app.binance.com/cedefi/wc?uri=... -> https://app.binance.com/cedefi/wc?uri=...
  if (url.startsWith('bnc://app.binance.com/')) {
    return `https://app.binance.com/${url.slice('bnc://app.binance.com/'.length)}`;
  }

  return url;
}

/**
 * Intercepts window.open calls intended for mobile wallet deeplinking.
 *
 * Why:
 * 1. Mobile browsers (iOS Safari, Android Chrome) strictly block window.open()
 *    when triggered asynchronously (e.g. after Reown finishes generating the
 *    wcUri 500-1500ms after the user taps a wallet).
 * 2. iOS Safari refuses to dispatch custom URI schemes (metamask://, trust://)
 *    inside window.open(url, '_self', 'noreferrer noopener') because of 'noopener'
 *    context isolation.
 * 3. By converting known custom wallet schemes to their official Universal Links
 *    (e.g. metamask://wc?uri= -> https://metamask.app.link/wc?uri=) and assigning
 *    via window.location.href, iOS and Android automatically intercept and launch
 *    the native wallet app seamlessly without popup blocking.
 */
function installMobileRedirectGuard() {
  if (typeof window === 'undefined') return;
  const originalOpen = window.open;

  window.open = function patchedOpen(
    url?: string | URL,
    target?: string,
    features?: string,
  ): WindowProxy | null {
    const urlStr =
      typeof url === 'string' ? url : url instanceof URL ? url.href : '';

    if (urlStr && isWalletUri(urlStr)) {
      const targetUrl = toUniversalOrMobileUrl(urlStr);
      try {
        window.location.href = targetUrl;
        return null;
      } catch (err) {
        console.warn('[AppKit] direct mobile navigation fallback failed:', err);
      }
    }

    return originalOpen.call(window, url as any, target as any, features as any);
  };
}

export function AppKitInit({ children }: { children: ReactNode }) {
  // Gate children behind init: useAppKit()/useAppKitAccount() are called during
  // render in consumers (e.g. WalletConnect), so they must NOT render before
  // createAppKit() has run. By rendering children only after the init effect
  // completes, we guarantee the AppKit context exists before any consumer
  // mounts — fixing the "call createAppKit before useAppKit" error on reload.
  const [ready, setReady] = useState(initialized);

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    installMobileRedirectGuard();

    installTelemetryGuard();

    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      defaultNetwork: networks[0],
      projectId,
      metadata,
      featuredWalletIds: FEATURED_WALLET_IDS,
      excludeWalletIds: EXCLUDED_WALLET_IDS,
      features: {
        analytics: false,
        email: false,
        socials: [],
      },
      enableNetworkSwitch: false,
      allowUnsupportedChain: true,
      experimental_preferUniversalLinks: true,
      themeMode: 'light',
    });
    setReady(true);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
