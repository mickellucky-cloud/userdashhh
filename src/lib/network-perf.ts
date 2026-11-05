/**
 * src/lib/network-perf.ts
 *
 * Pure utility functions for adaptive network performance, slow-connection
 * detection (2G/3G/Save-Data), React Query cache tuning, and route prefetch
 * gating so users on constrained or high-latency connections get fast loads
 * and minimal redundant requests.
 */

export interface NetworkInformationLike {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

export interface AdaptiveQueryConfig {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean | 'always';
  retry: number;
  retryDelay: (attemptIndex: number) => number;
}

/**
 * Safely reads the browser's Navigator.connection (Network Information API)
 * when available, returning undefined on the server or unsupported browsers.
 */
export function getBrowserConnection(): NetworkInformationLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

/**
 * Returns true when the client is on a slow connection (slow-2g, 2g, 3g,
 * high RTT > 400ms, low downlink < 1.5 Mbps) or has Data Saver enabled.
 */
export function isSlowConnection(conn?: NetworkInformationLike | null): boolean {
  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (
    conn.effectiveType === 'slow-2g' ||
    conn.effectiveType === '2g' ||
    conn.effectiveType === '3g'
  ) {
    return true;
  }
  if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.5) {
    return true;
  }
  if (typeof conn.rtt === 'number' && conn.rtt > 400) {
    return true;
  }
  return false;
}

/**
 * Determines whether background route prefetching should be enabled.
 * Disables speculative prefetching on Save-Data or 2G/slow-2G connections
 * so bandwidth is reserved for the active screen.
 */
export function shouldPrefetchRoute(conn?: NetworkInformationLike | null): boolean {
  if (!conn) return true;
  if (conn.saveData === true) return false;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
    return false;
  }
  return true;
}

/**
 * Computes React Query default options adapted to the user's connection speed.
 * Slow connections cache data 3x longer in memory to prevent redundant round-trips
 * when navigating back and forth between dashboard tabs.
 */
export function getOptimalQueryConfig(
  conn?: NetworkInformationLike | null,
): AdaptiveQueryConfig {
  const slow = isSlowConnection(conn);
  return {
    staleTime: slow ? 180_000 : 60_000, // 3 min on slow networks, 1 min on standard
    gcTime: slow ? 900_000 : 600_000, // 15 min on slow networks, 10 min on standard
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    retry: 1,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 4000),
  };
}
