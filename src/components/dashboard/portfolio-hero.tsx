'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useMe } from '@/lib/hooks/use-me';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { useStreak } from '@/lib/hooks/use-rewards';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Flame, Clock, ChevronRight, ChevronsRight, CheckCircle2 } from 'lucide-react';
import { formatPoints, shortenAddress } from '@/lib/utils';

interface PortfolioHeroProps {
  activeTab: 'activity' | 'portfolio';
  onTabChange: (tab: 'activity' | 'portfolio') => void;
}

export function PortfolioHero({ activeTab, onTabChange }: PortfolioHeroProps) {
  const t = useTranslations('dashboard.portfolio');
  const me = useMe();
  const eligibility = useClaimEligibility();
  const streak = useStreak();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const user = me.data?.user;
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : 'DE';

  const points = eligibility.data?.points ?? 100;
  const currentStreak = streak.data?.currentStreak ?? 5;

  return (
    <section className="hero-animate w-full bg-[#7A12F5] text-white rounded-b-[36px] md:rounded-b-[40px] shadow-lg shadow-[#7A12F5]/10">
      <div className="max-w-[1200px] mx-auto px-6 py-8 md:px-8 md:py-9 flex flex-wrap gap-8 items-stretch justify-between">
        {/* Left Column: Heading, Welcome, Big Points & Badges */}
        <div className="flex-1 min-w-[280px] md:min-w-[380px] flex flex-col justify-between">
          <div>
            <div className="text-sm font-bold text-[#E4D3FF] tracking-wide">
              Welcome back, {initials}
            </div>
            <h1 className="num-font text-3xl md:text-4xl font-extrabold tracking-tight mt-1.5 leading-none">
              Portfolio
            </h1>
            <p className="text-sm md:text-[15px] font-semibold text-[#E4D3FF] mt-1.5">
              Your $OKN at a glance: activity, holdings, and earnings.
            </p>
          </div>

          <div className="mt-7 pt-4">
            <div className="text-sm font-semibold text-[#E4D3FF]">Your OK Points</div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="num-font text-6xl md:text-7xl lg:text-[88px] font-bold leading-none tracking-tight">
                {eligibility.isLoading ? '�' : formatPoints(points)}
              </span>
              <div className="flex flex-col gap-2 items-start">
                <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/20 text-xs md:text-sm font-bold backdrop-blur-xs">
                  <Flame className="size-4 fill-orange-400 text-orange-400" />
                  {currentStreak}-day streak
                </span>
                <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/20 text-xs md:text-sm font-bold backdrop-blur-xs">
                  <Clock className="size-3.5 text-white/90" />
                  Awaiting Merkle commit
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Switcher & Wallet Action Banner */}
        <div className="w-full lg:w-[420px] flex flex-col justify-between gap-5">
          {/* Glass Pill Tab Switcher */}
          <div
            role="tablist"
            aria-label="Portfolio view"
            className="self-start lg:self-end flex gap-1 p-1 rounded-full bg-white/18 backdrop-blur-md border border-white/10"
          >
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'activity'}
              onClick={() => onTabChange('activity')}
              className={`h-9 px-5 rounded-full text-xs md:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-white text-[#0A0A0C] shadow-sm'
                  : 'text-white hover:text-white/80'
              }`}
            >
              Activity
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'portfolio'}
              onClick={() => onTabChange('portfolio')}
              className={`h-9 px-5 rounded-full text-xs md:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-white text-[#0A0A0C] shadow-sm'
                  : 'text-white hover:text-white/80'
              }`}
            >
              Holdings
            </button>
          </div>

          {/* Wallet CTA Card */}
          <div className="p-5 rounded-[28px] bg-[#8C38F7] border border-white/10 flex flex-col gap-4 shadow-sm">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-[#2FBD8E]" />
                  <span className="text-xs font-bold text-[#E4D3FF] uppercase tracking-wider">
                    Wallet Connected
                  </span>
                </div>
                <div className="text-sm font-medium text-[#F6EEFF] leading-relaxed">
                  Your address {shortenAddress(address ?? '')} is active on BSC.
                </div>
                <button
                  type="button"
                  onClick={() => open()}
                  className="relative h-12 w-full rounded-full bg-white text-[#0A0A0C] text-sm font-extrabold flex items-center justify-center px-4 hover:bg-white/90 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span className="absolute left-1.5 top-1.5 size-9 rounded-full bg-[#0A0A0C] text-white flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-[#2FBD8E]" />
                  </span>
                  Manage Wallet
                  <span className="absolute right-4 text-[#8A8A96]">
                    <ChevronsRight className="size-4" />
                  </span>
                </button>
              </>
            ) : (
              <>
                <div className="text-sm leading-relaxed text-[#F6EEFF] font-medium">
                  Claims open after the next Merkle commit. Connect your wallet now so you are ready.
                </div>
                <button
                  type="button"
                  onClick={() => open()}
                  className="relative h-13 w-full rounded-full bg-white text-[#0A0A0C] text-sm md:text-[15px] font-extrabold flex items-center justify-center px-4 hover:bg-white/90 active:scale-[0.98] transition-transform cursor-pointer shadow-md"
                >
                  <span className="absolute left-1.5 top-1.5 size-10 rounded-full bg-[#0A0A0C] text-white flex items-center justify-center">
                    <ChevronRight className="size-5" />
                  </span>
                  Connect wallet
                  <span className="absolute right-4 text-[#8A8A96]">
                    <ChevronsRight className="size-5" />
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
