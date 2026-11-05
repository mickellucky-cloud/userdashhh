import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatUnits } from 'viem';

/** cn() — shadcn-style className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a bigint wei amount as a human-readable number string. */
export function formatToken(wei: bigint, decimals = 18n): string {
  const whole = wei / 10n ** decimals;
  return whole.toLocaleString();
}

/**
 * Format a wei value (string or bigint, 18 decimals by default) for display:
 * grouped thousands, trimmed fraction. "1234000000000000000000" -> "1,234"
 */
export function formatWei(wei: string | bigint | null | undefined, decimals = 18, maxFrac = 4): string {
  if (wei == null) return '0';
  try {
    const s = formatUnits(BigInt(wei), decimals);
    const [whole = '0', frac] = s.split('.');
    const w = Number(whole).toLocaleString('en-US');
    if (!frac) return w;
    const f = frac.slice(0, maxFrac).replace(/0+$/, '');
    return f ? `${w}.${f}` : w;
  } catch {
    return String(wei);
  }
}

/** Compact points/number formatting: 12,500 */
export function formatPoints(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('en-US');
}

/** "Jul 18, 2026, 2:40 PM" from an ISO string or Date. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/**
 * Relative time: "just now", "12 minutes ago", "3 hours ago", "2 days ago".
 * Falls back to formatDate() beyond 30 days so stale timestamps stay readable.
 */
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

/** Truncate an EVM address: 0x1234…abcd */
export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Alias for shortAddress */
export const shortenAddress = shortAddress;

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Flatten a TanStack Query infinite-query result (array of Page<T>) into the
 * accumulated items + the total from the first page. Used by the paginated
 * admin lists (G5).
 */
export function flattenPages<T>(
  pages: { items: T[]; total: number }[] | undefined,
): { items: T[]; total: number } {
  if (!pages || pages.length === 0) return { items: [], total: 0 };
  return { items: pages.flatMap((p) => p.items), total: pages[0]!.total };
}
