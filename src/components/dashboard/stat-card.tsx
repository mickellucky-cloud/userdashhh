/**
 * dashboard/stat-card.tsx — KPI card with tinted icon, label, tabular value.
 */
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const TINTS = {
  blue: 'bg-[rgba(9,180,255,0.12)] text-[#09B4FF]',
  green: 'bg-[rgba(47,189,142,0.14)] text-[#2FBD8E]',
  orange: 'bg-[rgba(255,170,0,0.15)] text-[#FFAA00]',
  indigo: 'bg-[rgba(122,18,245,0.14)] text-[#C9A6FF]',
  red: 'bg-red-500/15 text-red-500',
  gray: 'bg-zinc-500/15 text-zinc-400',
} as const;

export type StatTint = keyof typeof TINTS;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tint = 'blue',
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tint?: StatTint;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#7A12F5]/35 hover:shadow-xl hover:shadow-black/20">
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105',
            TINTS[tint],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-[var(--mut)] uppercase">
            {label}
          </p>
          <p className="num mt-0.5 truncate text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-[26px]">
            {value}
          </p>
        </div>
      </div>
      {hint ? (
        <p className="mt-3 truncate text-xs font-medium text-[var(--mut)]">{hint}</p>
      ) : null}
    </div>
  );
}
