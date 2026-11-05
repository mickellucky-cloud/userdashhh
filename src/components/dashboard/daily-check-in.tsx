'use client';

/**
 * components/dashboard/daily-check-in.tsx — Phase 2
 *
 * Mounted once in AppShell (app area only) so it survives page navigations and
 * dev hot reloads (per the AGENTS.md stable-animation rule). Fires the daily
 * check-in exactly once per browser-day:
 *
 *   1. On mount, read the streak. If not checked in today, fire check-in.
 *   2. A localStorage guard ("okn-checkin-<YYYY-MM-DD>") prevents refires
 *      across same-day remounts (HMR, route changes) without waiting on the
 *      server — this keeps the UX instant and avoids a storm of POSTs.
 *   3. On success, show a celebratory toast.
 *
 * The server route is itself idempotent (advisory-locked), so even if the
 * guard is wrong (cleared storage, cross-tab race), the user can't be
 * double-awarded. The guard is purely a client-side UX optimization.
 */
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { useCheckIn, useStreak } from '@/lib/hooks/use-rewards';
import { useToast } from '@/components/ui/use-toast';
import { formatPoints, cn } from '@/lib/utils';

/** localStorage key scoped to the UTC day, so it rotates automatically. */
function todayKey() {
  return `okn-checkin-${new Date().toISOString().slice(0, 10)}`;
}

export function DailyCheckIn() {
  const tToast = useTranslations('toasts.dailyCheckIn');
  const streak = useStreak();
  const checkIn = useCheckIn();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for the streak read to resolve so we know whether today needs a check-in.
    if (!streak.data || streak.isLoading || streak.isError) return;
    // Already checked in today per the server — nothing to do.
    if (streak.data.checkedInToday) return;
    // Client-side guard: don't refire within the same browser-day.
    if (typeof window !== 'undefined' && window.localStorage.getItem(todayKey())) return;

    if (typeof window !== 'undefined') {
      // Set the guard BEFORE firing so a fast remount during the in-flight POST
      // doesn't duplicate it. The server is idempotent anyway; this is UX-only.
      window.localStorage.setItem(todayKey(), '1');
    }

    checkIn.mutate(undefined, {
      onSuccess: (result) => {
        if (result.awarded) {
          toast({
            title: tToast('streakTitle', { day: result.day ?? 0 }),
            description: tToast('streakDesc', { points: formatPoints(result.points) }),
          });
        }
      },
      onError: () => {
        // Roll back the guard so a genuine failure retries next mount.
        if (typeof window !== 'undefined') window.localStorage.removeItem(todayKey());
      },
    });
    // We intentionally only depend on the streak read + a static mutate ref. We
    // do NOT depend on checkIn (it changes identity); the guard + checkedInToday
    // flag prevent loops.
  }, [streak.data, streak.isLoading, streak.isError]);

  // Renders nothing — this is a side-effect-only component.
  return null;
}

/**
 * Streak widget for the /app overview. Shows current streak, next reward, and
 * longest streak. Pure presentation; the check-in itself is fired by
 * <DailyCheckIn /> above (mounted in the shell), so this card just reflects
 * server state.
 */
export function StreakWidget() {
  const t = useTranslations('dashboard.dailyCheckIn');
  const streak = useStreak();

  if (streak.isLoading || !streak.data) {
    return (
      <div className="flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(255,170,0,0.15)] text-[#FFAA00]">
            <Flame className="size-6 animate-pulse" />
          </span>
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-[var(--line)]" />
            <div className="h-6 w-32 rounded bg-[var(--line)]" />
          </div>
        </div>
      </div>
    );
  }

  const s = streak.data;
  const checkedIn = s.checkedInToday;
  const currentDays = s.currentStreak ?? 0;
  // Calculate day in weekly cycle (1-7)
  const cycleDay = currentDays === 0 ? 0 : ((currentDays - 1) % 7) + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(255,170,0,0.15)] text-[#FFAA00] shadow-[0_0_15px_rgba(255,170,0,0.2)]">
          <Flame className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-[var(--mut)] uppercase">
            {t('label')}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-3">
            <p className="num text-2xl font-extrabold tracking-tight text-[var(--tx)]">
              {s.currentStreak === 1
                ? t('daySingular', { count: s.currentStreak })
                : t('dayPlural', { count: s.currentStreak })}
            </p>
            <p className="text-xs font-medium text-[var(--mut)]">
              {checkedIn
                ? t('checkedIn', { longest: formatPoints(s.longestStreak) })
                : s.nextReward != null
                  ? t('nextReward', { reward: formatPoints(s.nextReward) })
                  : t('noStreak')}
            </p>
          </div>
        </div>
      </div>

      {/* Gamified 7-Day Streak Capsule Visualizer */}
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
          const isDone = dayIndex <= cycleDay;
          const isCurrent = dayIndex === cycleDay;
          const isNext = dayIndex === cycleDay + 1;

          return (
            <div
              key={dayIndex}
              title={`Day ${dayIndex}${isCurrent ? ' (Today)' : isNext ? ' (Next)' : ''}`}
              className={cn(
                'h-9 flex-1 sm:w-3.5 sm:flex-initial rounded-[7px] transition-all duration-300',
                isDone
                  ? 'bg-gradient-to-b from-[#8C38F7] to-[#7A12F5] shadow-[0_2px_8px_rgba(122,18,245,0.4)]'
                  : isNext
                    ? 'border-1.5 border-dashed border-[var(--line)] bg-[var(--s2)] opacity-70'
                    : 'bg-[var(--s2)] opacity-35',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
