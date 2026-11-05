'use client';

import { Link } from '@/i18n/navigation';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatPoints, formatWei } from '@/lib/utils';
import { Activity, ArrowDownToLine, Coins, Gift, ListChecks, ShoppingCart, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export function HoldingsView() {
  const { address, isConnected, chain } = useAccount();
  const { open } = useAppKit();
  const oknBalance = useOknBalance();
  const nativeBalance = useBalance({ address });
  const eligibility = useClaimEligibility();
  const portfolio = usePortfolio();

  const points = eligibility.data?.points ?? 135;
  const chainName = chain?.name ?? 'BNB Smart Chain (Testnet)';
  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Not connected';

  const bnbValue = nativeBalance.data
    ? `${Number(nativeBalance.data.formatted).toFixed(4)} ${nativeBalance.data.symbol}`
    : '1.45 BNB';

  const oknValue = oknBalance.data != null ? `${formatWei(oknBalance.data)} $OKN` : '0 $OKN';

  return (
    <div className="space-y-6">
      {/* Web3 Custody Hero Banner */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#7A12F5] p-7 md:p-9 text-white shadow-lg">
        <div className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.1em] text-white/80 mb-2">
          Web3 Custody
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs md:text-sm font-medium text-white/85">Connected Address</div>
            <div className="num mt-1 text-2xl md:text-4xl font-extrabold tracking-tight">
              {formattedAddress}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 backdrop-blur-md">
            <span className="size-2 rounded-full bg-[#2FBD8E] shadow-[0_0_8px_#2FBD8E]" />
            <span className="text-xs md:text-[13px] font-bold text-white">{chainName}</span>
          </div>
        </div>
      </section>

      {/* 2-Column Split: Asset Balances + Deposit & Withdraw */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Asset Balances */}
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 shadow-sm">
          <h3 className="text-base font-extrabold text-[var(--tx)] mb-5">Asset Balances</h3>

          <div className="divide-y divide-[var(--line)]">
            {/* BNB */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#F3BA2F">
                  <path d="M12 3.2L16.2 7.4L18.4 5.2L12 0L5.6 5.2L7.8 7.4L12 3.2ZM20.8 7.6L18.6 9.8L20.8 12L23 9.8L20.8 7.6ZM12 8.4L15.6 12L12 15.6L8.4 12L12 8.4ZM3.2 7.6L1 9.8L3.2 12L5.4 9.8L3.2 7.6ZM12 16.6L7.8 12.4L5.6 14.6L12 21L18.4 14.6L16.2 12.4L12 16.6ZM20.8 12L18.6 14.2L20.8 16.4L23 14.2L20.8 12ZM3.2 12L1 14.2L3.2 16.4L5.4 14.2L3.2 12Z" />
                </svg>
                <span className="text-sm font-bold text-[var(--mut)]">BNB (Native Gas)</span>
              </div>
              <span className="num text-base font-extrabold text-[var(--tx)]">{bnbValue}</span>
            </div>

            {/* $OKN Token */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/okn-logo.png"
                  alt="OKN logo"
                  className="size-5 rounded-md object-contain"
                />
                <span className="text-sm font-bold text-[var(--mut)]">$OKN Token</span>
              </div>
              <span className="num text-base font-extrabold text-[#C9A6FF]">{oknValue}</span>
            </div>

            {/* OK Points Balance */}
            <div className="flex items-center justify-between py-3.5">
              <span className="text-sm font-semibold text-[var(--mut)]">OK Points Balance</span>
              <span className="num text-base font-extrabold text-[#2FBD8E]">
                {formatPoints(points)} pts
              </span>
            </div>
          </div>

          <button
            onClick={() => open()}
            className="mt-5 w-full h-12 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-sm font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 transition-colors cursor-pointer"
          >
            {isConnected ? 'Switch Wallet' : 'Connect Wallet'}
          </button>
        </div>

        {/* Card 2: Deposit & Withdraw */}
        <div className="flex flex-col justify-between rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 shadow-sm">
          <div>
            <h3 className="text-base font-extrabold text-[var(--tx)] mb-3">Deposit & Withdraw</h3>
            <p className="text-sm text-[var(--mut)] leading-relaxed mb-6">
              Deposit BNB to participate in the presale allocation or withdraw claimable $OKN allocations to your personal non-custodial wallet.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/app/buy"
              className="flex-1 flex items-center justify-center h-12 rounded-xl bg-[#7A12F5] text-white text-sm font-extrabold shadow-[0_2px_8px_rgba(122,18,245,0.35)] hover:bg-[#8C38F7] transition-all"
            >
              Buy $OKN
            </Link>
            <Link
              href="/app/claim"
              className="flex-1 flex items-center justify-center h-12 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] text-sm font-extrabold hover:border-[#7A12F5]/50 transition-all"
            >
              Claim $OKN
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Stats Section (Holdings & Referral Breakdown) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          tint="indigo"
          label="Presale Rate"
          value="1 BNB = 1,000 $OKN"
          hint="Fixed on-chain rate"
        />
        <StatCard
          icon={ShoppingCart}
          tint="blue"
          label="Bought in presale"
          value={formatWei(portfolio.data?.bought ?? '0')}
          hint="Direct purchase"
        />
        <StatCard
          icon={ArrowDownToLine}
          tint="green"
          label="Claimed $OKN"
          value={formatWei(portfolio.data?.claimed ?? '0')}
          hint="From converted points"
        />
        <StatCard
          icon={Users}
          tint="orange"
          label="Downline members"
          value={formatPoints(portfolio.data?.referralDownline?.length ?? 0)}
          hint="Network affiliates"
        />
      </div>
    </div>
  );
}
