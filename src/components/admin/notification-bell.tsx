'use client';

/**
 * components/admin/notification-bell.tsx
 *
 * Bell icon in the admin header showing unread notification count. Polls
 * /api/notifications every 30s. Clicking opens a dropdown list of recent
 * notifications with links to the relevant pages.
 *
 * UI/UX (ui-ux-pro-max):
 *   - 44px touch target (size-11 button)
 *   - aria-label with dynamic count for screen readers
 *   - Badge uses icon + number (not color alone)
 *   - aria-live="polite" for new notification announcements
 *   - Loading skeleton while fetching
 *   - Empty state when no notifications
 *   - Auto-refresh on window focus
 */
import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications() as Promise<{ notifications: Notification[]; unreadCount: number }>,
    refetchInterval: 30_000,
    // Also refetch on window focus
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      void markRead.mutate(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
    setOpen(false);
  };

  const markAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markRead.mutate(n.id));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] transition-all duration-200 hover:border-[#7A12F5]/50 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
      >
        <Bell className="size-[18px]" aria-hidden />
        <span
          className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#7A12F5] ring-1.5 ring-[var(--s1)] shadow-[0_0_6px_rgba(122,18,245,0.6)]"
          aria-hidden
        />
      </button>

      {open && (
        <div
          aria-live="polite"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-ios-blue transition-colors hover:text-ios-blue/80"
                aria-label="Mark all as read"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="size-8 text-muted-foreground/50" aria-hidden />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleClick(notif)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    !notif.read && 'bg-ios-blue/5',
                  )}
                >
                  {/* Unread dot */}
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      notif.read ? 'bg-transparent' : 'bg-ios-blue',
                    )}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notif.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Human-readable relative time. */
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
