'use client';

/**
 * dashboard/status-badge.tsx — semantic status badges with icon + label.
 * Never color-only: every status pairs a tint with an icon and text.
 *
 * The label is resolved from the dashboard.statusBadge message namespace
 * by status key. Icons + colors stay hardcoded (not translatable).
 */
import { CheckCircle2, Clock, EyeOff, XCircle, PauseCircle, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const MAP: Record<string, { icon: LucideIcon; className: string }> = {
  pending: { icon: Clock, className: 'bg-ios-orange/10 text-ios-orange' },
  eligible: { icon: Clock, className: 'bg-ios-blue/10 text-ios-blue' },
  verified: { icon: CheckCircle2, className: 'bg-ios-green/10 text-ios-green' },
  approved: { icon: CheckCircle2, className: 'bg-ios-green/10 text-ios-green' },
  paid: { icon: CheckCircle2, className: 'bg-ios-green/10 text-ios-green' },
  rejected: { icon: XCircle, className: 'bg-ios-red/10 text-ios-red' },
  active: { icon: CheckCircle2, className: 'bg-ios-green/10 text-ios-green' },
  inactive: { icon: PauseCircle, className: 'bg-ios-gray/10 text-ios-gray' },
  paused: { icon: PauseCircle, className: 'bg-ios-orange/10 text-ios-orange' },
  draft: { icon: EyeOff, className: 'bg-ios-indigo/10 text-ios-indigo' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const t = useTranslations('dashboard.statusBadge');
  const entry = MAP[status];
  const Icon = entry?.icon ?? Clock;
  const label = entry ? t(status as never) : status;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        entry?.className ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
