'use client';

/**
 * /app/agents — OKN Autonomous Suite & Unified Agents Hub.
 *
 * Sums all agents and autonomous features in one seamless surface:
 *   1. Staking (Lock $OKN, earn APY)
 *   2. AI Trading Agent (24/7 market scanning co-pilot)
 *   3. Polymarket Copy Agent (Auto-mirror top 1% prediction whales)
 *   4. Prediction Markets (Decentralized outcome contracts)
 */
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

const STAKING_PERIODS = ['30d', '90d', '180d', '365d'];

export default function AgentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('90d');

  return (
    <main className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-12">
      {/* Hero Banner — Coming to OKN */}
      <section className="relative overflow-hidden rounded-[28px] md:rounded-[32px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3">
            <Sparkles className="size-3.5" />
            <span>Autonomous Protocol Suite</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Coming to OKN
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-[#E4D3FF] leading-relaxed">
            Four autonomous features are being built. Mirror whale trades, execute risk-managed signals, or stake $OKN for yield.
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -bottom-12 size-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      </section>

      {/* Feature Card 1: Staking */}
      <section className="rounded-[24px] bg-[var(--inv-bg)] text-[var(--inv-tx)] p-5 md:p-6 shadow-sm border border-[var(--line)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--inv-tx)] text-[var(--inv-bg)] shadow-inner">
              <Lock className="size-5 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-extrabold text-[var(--inv-tx)] leading-tight">
                Staking
              </h2>
              <p className="text-xs md:text-sm font-semibold text-[var(--inv-mut)] mt-0.5 truncate">
                Lock $OKN, earn APY. Longer locks earn higher multipliers.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-[var(--inv-tx)] text-[var(--inv-bg)] text-[11px] font-extrabold">
            Coming soon
          </span>
        </div>

        {/* Duration Pills */}
        <div className="grid grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-[var(--line)]/40">
          {STAKING_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelectedPeriod(period)}
              className={`h-11 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedPeriod === period
                  ? 'bg-[#7A12F5] text-white shadow-[0_2px_10px_rgba(122,18,245,0.4)]'
                  : 'bg-[var(--inv-chip)] text-[var(--inv-tx)] hover:opacity-80'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </section>

      {/* Feature Card 2: AI Trading Agent */}
      <section className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFAA00]/20 text-[#FFAA00] shadow-sm">
              <TrendingUp className="size-5 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-extrabold text-[var(--tx)] leading-tight">
                AI Trading Agent
              </h2>
              <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-0.5 truncate">
                Your AI co-pilot for crypto signals
              </p>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-[#FFAA00]/15 text-[#FFAA00] text-[11px] font-extrabold border border-[#FFAA00]/30">
            In development
          </span>
        </div>
        <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-3 leading-relaxed">
          24/7 market scanning, automated entry, target and stop levels, confidence scoring, and risk-managed position sizing.
        </p>
      </section>

      {/* Feature Card 3: Polymarket Copy Agent (LIVE NOW) */}
      <section className="rounded-[24px] border-2 border-[#1652F0]/60 bg-gradient-to-br from-[#1652F0]/15 via-[var(--s1)] to-[var(--s1)] p-5 md:p-6 shadow-[0_8px_24px_rgba(22,82,240,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/polymarket.png"
              alt="Polymarket"
              className="size-11 rounded-2xl object-cover shadow-[0_4px_12px_rgba(22,82,240,0.45)] border border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-extrabold text-[var(--tx)] leading-tight">
                Polymarket Copy Agent
              </h2>
              <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-0.5 truncate">
                Automated whale prediction mirroring
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 text-[11px] font-extrabold">
            <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>LIVE NOW</span>
          </span>
        </div>

        <p className="text-xs md:text-sm font-semibold text-[var(--mut)] mt-3 leading-relaxed">
          24/7 whale wallet tracking, probability edge scoring, and 1-click automated copy execution on Polymarket outcome shares.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-[var(--line)]">
          <div className="flex items-center gap-4 text-xs font-extrabold">
            <span className="text-[#34D399]">+38.4% 7D ROI</span>
            <span className="text-[#09B4FF]">78.4% Win Rate</span>
            <span className="text-[var(--mut)]">142 whales</span>
          </div>

          <Link
            href="/app/polymarket-agent"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#1652F0] text-white text-xs font-extrabold shadow-[0_4px_12px_rgba(22,82,240,0.4)] hover:bg-[#1E60FF] active:scale-95 transition-all"
          >
            <span>Open Agent</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Feature Card 4: Prediction Markets */}
      <Link
        href="/app/prediction-markets"
        className="flex items-center justify-between gap-3 h-[76px] px-5 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] shadow-sm hover:scale-[1.01] active:scale-98 transition-all group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E81CFF]/15 text-[#E81CFF] shadow-sm">
            <BarChart3 className="size-5 stroke-[2.5]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-[var(--tx)] leading-tight group-hover:text-[#E81CFF] transition-colors">
              Prediction Markets
            </h2>
            <p className="text-xs font-semibold text-[var(--mut)] mt-0.5 truncate">
              Track outcome markets across decentralized protocols
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-[var(--s2)] text-[var(--tx)] text-[11px] font-extrabold border border-[var(--line)]">
            Coming soon
          </span>
          <ChevronRight className="size-4 text-[var(--mut)]" />
        </div>
      </Link>
    </main>
  );
}
