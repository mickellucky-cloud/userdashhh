'use client';

/**
 * dashboard/data-state.tsx — loading, error, and empty states.
 * Every data-bound section renders one of these instead of a blank box.
 *
 * ErrorState default message + Retry button come from the dashboard.dataState
 * message namespace.
 */
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton rows matching a stat-card grid. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 md:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Skeleton rows matching a list/table body. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('dashboard.dataState');
  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-sm">{message ?? t('error')}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            {t('retry')}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * A soft warning banner for the "loaded with default/stale data" case —
 * visually distinct from ErrorState (amber, not destructive red) because the
 * UI is still USABLE, just degraded. Use this when a fetch failed and the
 * section fell back to defaults so the admin can keep working while a retry
 * is offered. Renders inline (not a full Card) so it sits naturally at the top
 * of a form or list.
 */
export function WarningBanner({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('dashboard.dataState');
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
    >
      <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-200">
        {message ?? t('staleWarning')}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="size-3.5" />
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {message ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {action}
    </Card>
  );
}
