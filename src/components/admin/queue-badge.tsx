'use client';

/**
 * Live pending-verification count pill for the admin moderation queue.
 *
 * Rendered ONLY inside the admin area (the backing endpoint requires an admin
 * session; mounting it in the app sidebar would fire guaranteed-401 polls).
 * Hidden when the count is zero or unavailable — the bell notification is the
 * attention signal, this is the persistent "how big is the queue" indicator.
 */
import { usePendingCompletionsCount } from '@/lib/hooks/use-admin';

export function ModerationQueueBadge({ dark = false }: { dark?: boolean }) {
  const { data } = usePendingCompletionsCount();
  if (!data || data.pending === 0) return null;
  return (
    <span
      className={
        dark
          ? 'ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-ios-blue px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white'
          : 'inline-flex min-w-5 items-center justify-center rounded-full bg-ios-red px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white'
      }
      aria-label={`${data.pending} pending submissions`}
    >
      {data.pending > 99 ? '99+' : data.pending}
    </span>
  );
}
