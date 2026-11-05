'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface TxItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  asset: 'OK Points' | '$OKN';
  amount: string;
  status: 'Awaiting commit' | 'Confirmed' | 'Pending';
}

const DEFAULT_TXS: TxItem[] = [
  {
    id: '1',
    title: 'Daily check-in',
    subtitle: 'Day 6 of streak',
    date: 'Nov 2, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
  },
  {
    id: '2',
    title: 'Daily check-in',
    subtitle: 'Day 5 of streak',
    date: 'Nov 1, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
  },
  {
    id: '3',
    title: 'Daily check-in',
    subtitle: 'Day 4 of streak',
    date: 'Oct 31, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
  },
  {
    id: '4',
    title: 'Daily check-in',
    subtitle: 'Day 3 of streak',
    date: 'Oct 30, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
  },
  {
    id: '5',
    title: 'Daily check-in',
    subtitle: 'Day 2 of streak',
    date: 'Oct 29, 2026',
    asset: 'OK Points',
    amount: '+20 pts',
    status: 'Awaiting commit',
  },
];

export function TransactionHistory() {
  const [filter, setFilter] = useState<'All' | 'OK Points' | '$OKN'>('All');

  const filtered = DEFAULT_TXS.filter((tx) => {
    if (filter === 'All') return true;
    return tx.asset === filter;
  });

  return (
    <div className="mt-7 rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-extrabold text-[var(--tx)]">Transaction history</h3>
          <p className="text-xs md:text-sm text-[var(--mut)]">Every OK Points and $OKN movement on your account.</p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 gap-1">
          {(['All', 'OK Points', '$OKN'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)]'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] border-collapse text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">
              <th className="py-3 pr-4 pl-1">Description</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 pl-4 pr-1 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-[var(--line)]/40 transition-colors hover:bg-white/[0.02]">
                <td className="py-3.5 pr-4 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(47,189,142,0.14)] text-[#2FBD8E]">
                      <Check className="size-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--tx)]">{row.title}</div>
                      <div className="text-[11px] font-medium text-[var(--mut)]">{row.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-medium text-[var(--mut)]">{row.date}</td>
                <td className="py-3.5 px-4 font-bold text-[var(--tx)]">{row.asset}</td>
                <td className="py-3.5 px-4 text-right font-extrabold text-[#2FBD8E]">{row.amount}</td>
                <td className="py-3.5 pl-4 pr-1 text-right">
                  <span className="inline-block rounded-lg border border-[rgba(255,170,0,0.25)] bg-[rgba(255,170,0,0.12)] px-2.5 py-1 text-[11px] font-bold text-[#FFAA00]">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
