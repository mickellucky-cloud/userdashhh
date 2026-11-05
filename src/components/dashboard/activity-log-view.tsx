'use client';

import { useState } from 'react';
import { Check, Coins, FileText, Gift, Sparkles } from 'lucide-react';
import { useStreak } from '@/lib/hooks/use-rewards';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { formatPoints } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'pts' | 'okn';
  title: string;
  date: string;
  amount: string;
  status: string;
  isPositive?: boolean;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'pts',
    title: 'Daily check-in',
    date: 'Day 5 of streak · Nov 2, 2026',
    amount: '+20 pts',
    status: 'Awaiting commit',
    isPositive: true,
  },
  {
    id: 'act-2',
    type: 'pts',
    title: 'Daily check-in',
    date: 'Day 4 of streak · Nov 1, 2026',
    amount: '+20 pts',
    status: 'Awaiting commit',
    isPositive: true,
  },
  {
    id: 'act-3',
    type: 'pts',
    title: 'Daily check-in',
    date: 'Day 3 of streak · Oct 31, 2026',
    amount: '+20 pts',
    status: 'Awaiting commit',
    isPositive: true,
  },
  {
    id: 'act-4',
    type: 'pts',
    title: 'Daily check-in',
    date: 'Day 2 of streak · Oct 30, 2026',
    amount: '+20 pts',
    status: 'Awaiting commit',
    isPositive: true,
  },
  {
    id: 'act-5',
    type: 'pts',
    title: 'Daily check-in',
    date: 'Day 1 of streak · Oct 29, 2026',
    amount: '+20 pts',
    status: 'Awaiting commit',
    isPositive: true,
  },
];

export function ActivityLogView() {
  const [filter, setFilter] = useState<'all' | 'pts' | 'okn'>('all');
  const streak = useStreak();
  const eligibility = useClaimEligibility();

  const filteredItems = SAMPLE_ACTIVITIES.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Audit Trail Hero Banner */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#7A12F5] p-7 md:p-9 text-white shadow-lg">
        <div className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.1em] text-white/80 mb-2">
          Audit Trail
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs md:text-sm font-medium text-white/85">Historical Records</div>
            <div className="num mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
              Activity Log
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-md">
            <div className="text-xs font-medium text-white/85">Transaction Count</div>
            <div className="mt-0.5 text-base font-extrabold text-white">5 verified movements</div>
          </div>
        </div>
      </section>

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`h-9.5 px-5 rounded-full text-xs md:text-[13px] font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
              : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pts')}
          className={`h-9.5 px-5 rounded-full text-xs md:text-[13px] font-bold transition-all cursor-pointer ${
            filter === 'pts'
              ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
              : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
          }`}
        >
          OK Points
        </button>
        <button
          onClick={() => setFilter('okn')}
          className={`h-9.5 px-5 rounded-full text-xs md:text-[13px] font-bold transition-all cursor-pointer ${
            filter === 'okn'
              ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
              : 'border border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
          }`}
        >
          $OKN
        </button>
      </div>

      {/* Activity Item List */}
      {filteredItems.length > 0 ? (
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 shadow-sm">
          <div className="divide-y divide-[var(--line)]">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--s2)] text-[#2FBD8E]">
                    <Check className="size-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[var(--tx)]">{item.title}</div>
                    <div className="text-xs text-[var(--mut)] font-medium mt-0.5">{item.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="num text-sm md:text-base font-extrabold text-[#2FBD8E]">
                    {item.amount}
                  </span>
                  <span className="rounded-full bg-[rgba(255,170,0,0.16)] px-2.5 py-0.5 text-[11px] font-extrabold text-[#FFAA00]">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State for $OKN or filtered results */
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--s1)] p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--mut)] mb-3">
            <Coins className="size-6" />
          </div>
          <div className="text-base font-extrabold text-[var(--tx)]">No $OKN activity yet</div>
          <div className="mt-1 text-xs text-[var(--mut)] max-w-sm">
            Claims and purchases will appear here once your wallet is connected and transactions are finalized.
          </div>
        </div>
      )}
    </div>
  );
}
