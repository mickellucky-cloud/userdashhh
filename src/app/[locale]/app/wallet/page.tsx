'use client';

/**
 * /app/wallet — Modern Web3 & Fintech Custody Wallet Dashboard.
 *
 * Integrated with the portfolio segmented control:
 *   Overview -> /app/portfolio
 *   Activity -> /app/portfolio?tab=activity
 *   Holdings (Active) -> /app/wallet
 */
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useOknBalance } from '@/lib/hooks/use-wallet';
import { useClaimEligibility } from '@/lib/hooks/use-claim';
import { formatPoints, formatWei, shortAddress } from '@/lib/utils';
import { toast } from 'sonner';

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { open } = useAppKit();
  const oknBalance = useOknBalance();
  const nativeBalance = useBalance({ address });
  const eligibility = useClaimEligibility();

  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState<'BNB' | 'OKN'>('BNB');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('okn_hide_balance') === 'true';
      setHideBalance(stored);
    } catch {}
  }, []);

  const toggleBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('okn_hide_balance', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const points = eligibility.data?.points ?? 135;
  const currentAddress = address || '0x71C...49b2';
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '0x71C...49b2';

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address || '0x71C94820d829E1A29D649b278148b1A29D649b2');
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Address copied');
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddress) {
      toast.error('Please enter a destination address');
      return;
    }
    toast.success(`Withdrawal request for ${withdrawAmount || '0.1'} ${withdrawAsset} submitted!`);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  return (
    <main className="space-y-4 md:space-y-6">
      {/* Mobile Segmented Switcher — Beautifully placed at top of mobile wallet */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--s2)] border border-[var(--line)] shadow-sm backdrop-blur-xl">
          <Link
            href="/app/portfolio"
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Overview
          </Link>
          <Link
            href="/app/portfolio?tab=activity"
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold text-[var(--mut)] hover:text-[var(--tx)] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Activity
          </Link>
          <span
            className="flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#7A12F5] to-[#8C38F7] text-white shadow-[0_2px_12px_rgba(122,18,245,0.45)] cursor-default"
          >
            Holdings
          </span>
        </div>
      </div>

      {/* Desktop Header with integrated switcher */}
      <div className="hidden md:flex flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--tx)] md:text-3xl">
            Portfolio
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--mut)]">
            Your $OKN at a glance: activity, holdings, and earnings.
          </p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 gap-1">
          <Link
            href="/app/portfolio"
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-all cursor-pointer"
          >
            Overview
          </Link>
          <Link
            href="/app/portfolio?tab=activity"
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-[var(--mut)] hover:text-[var(--tx)] transition-all cursor-pointer"
          >
            Activity
          </Link>
          <span className="rounded-lg px-4 py-1.5 text-xs font-bold bg-[#7A12F5] text-white shadow-[0_2px_8px_rgba(122,18,245,0.35)] cursor-default">
            Holdings
          </span>
        </div>
      </div>

      {/* 1. Fintech Account Summary Hero Card */}
      <section
        className="relative overflow-hidden rounded-[26px] border border-[var(--line)] p-6 md:p-8 shadow-sm transition-all"
        style={{
          background:
            'linear-gradient(135deg, rgba(122, 18, 245, 0.24) 0%, rgba(9, 180, 255, 0.12) 100%), var(--s1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
                Total Net Asset Value
              </span>
              <button
                type="button"
                onClick={toggleBalance}
                className="balance-eye-btn flex size-7 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--line)] transition-colors cursor-pointer"
                aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="num text-3xl md:text-5xl font-extrabold text-[var(--tx)] tracking-tight">
                {hideBalance ? '••••••••' : '$1,428.50'}
              </span>
              <span className="rounded-xl border border-[#2FBD8E]/30 bg-[#2FBD8E]/15 px-3 py-1 text-xs font-extrabold text-[#2FBD8E]">
                +$142.50 (24h)
              </span>
            </div>
          </div>

          {/* Custody & Address Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--s2)] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#2FBD8E] shadow-[0_0_8px_#2FBD8E]" />
              <span className="font-mono text-xs font-extrabold text-[var(--tx)]">
                {displayAddress}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="ml-1 text-[var(--mut)] hover:text-[var(--tx)] transition-colors cursor-pointer"
                aria-label="Copy address"
              >
                {copied ? <Check className="size-3.5 text-[#2FBD8E]" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => open()}
              className="h-10 px-4 rounded-2xl bg-[#7A12F5] text-white text-xs font-extrabold shadow-md hover:bg-[#8C38F7] active:scale-95 transition-all cursor-pointer"
            >
              {isConnected ? 'Switch Wallet' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Quick Fintech Action Dock */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--s2)] border border-[var(--line)] text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <ArrowDownLeft className="size-4 text-[#09B4FF]" />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--s2)] border border-[var(--line)] text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <ArrowUpRight className="size-4 text-[#FFD60A]" />
            <span>Withdraw</span>
          </button>

          <Link
            href="/app/buy"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--s2)] border border-[var(--line)] text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <ShoppingCart className="size-4 text-[#7A12F5]" />
            <span>Buy $OKN</span>
          </Link>

          <Link
            href="/app/tasks"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--s2)] border border-[var(--line)] text-xs font-extrabold text-[var(--tx)] hover:border-[#7A12F5]/50 hover:bg-[var(--s1)] active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <Zap className="size-4 text-[#2FBD8E]" />
            <span>Stake &amp; Earn</span>
          </Link>
        </div>
      </section>

      {/* 2. 4-Column Account Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(243,186,47,0.15)] text-[#F3BA2F]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3.2L16.2 7.4L18.4 5.2L12 0L5.6 5.2L7.8 7.4L12 3.2ZM20.8 7.6L18.6 9.8L20.8 12L23 9.8L20.8 7.6ZM12 8.4L15.6 12L12 15.6L8.4 12L12 8.4ZM3.2 7.6L1 9.8L3.2 12L5.4 9.8L3.2 7.6ZM12 16.6L7.8 12.4L5.6 14.6L12 21L18.4 14.6L16.2 12.4L12 16.6ZM20.8 12L18.6 14.2L20.8 16.4L23 14.2L20.8 12ZM3.2 12L1 14.2L3.2 16.4L5.4 14.2L3.2 12Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Liquid On-Chain</p>
              <p className="num text-xl font-extrabold text-[var(--tx)] mt-0.5">
                {hideBalance ? '••••••' : '$870.00'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--mut)] truncate">1.45 BNB (Gas Ready)</p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(122,18,245,0.15)] text-[#7A12F5]">
              <img src="/assets/okn-logo.png" alt="OKN" className="size-5 rounded-md object-contain" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Presale $OKN</p>
              <p className="num text-xl font-extrabold text-[var(--tx)] mt-0.5">
                {hideBalance ? '••••••' : '$416.00'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--mut)] truncate">693,333 $OKN Allocated</p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,214,10,0.15)] text-[#FFD60A]">
              <Users className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">Partner Vault</p>
              <p className="num text-xl font-extrabold text-[#2FBD8E] mt-0.5">
                {hideBalance ? '••••••' : '$142.50'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--mut)] truncate">0.238 BNB (14 Invites)</p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(9,180,255,0.15)] text-[#09B4FF]">
              <Coins className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)]">OK Points Value</p>
              <p className="num text-xl font-extrabold text-[var(--tx)] mt-0.5">
                {formatPoints(points)} pts
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-[#FFD60A] truncate">Awaiting Merkle Commit</p>
        </div>
      </div>

      {/* 3. Portfolio Allocation Bar Card */}
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-[var(--tx)]">Account Asset Allocation</h3>
          <span className="text-xs font-bold text-[var(--mut)]">100% Fully Backed</span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="h-4 w-full rounded-full bg-[var(--s2)] overflow-hidden flex gap-1 p-0.5 border border-[var(--line)]">
          <div className="h-full rounded-full bg-[#F3BA2F]" style={{ width: '60.9%' }} title="BNB: 60.9%" />
          <div className="h-full rounded-full bg-[#7A12F5]" style={{ width: '29.1%' }} title="Presale OKN: 29.1%" />
          <div className="h-full rounded-full bg-[#2FBD8E]" style={{ width: '10.0%' }} title="Partner Vault: 10.0%" />
        </div>

        {/* Legend */}
        <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#F3BA2F]" />
            <span className="text-[var(--tx)]">BNB (60.9%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#7A12F5]" />
            <span className="text-[var(--tx)]">Presale $OKN (29.1%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#2FBD8E]" />
            <span className="text-[var(--tx)]">Partner Vault (10.0%)</span>
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Split: Detailed Asset Breakdown & Account Rails */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column (span 3): Detailed Asset Breakdown */}
        <div className="lg:col-span-3 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <h3 className="text-base font-extrabold text-[var(--tx)]">Asset Holdings Breakdown</h3>
            <span className="text-xs font-bold text-[var(--mut)]">4 Active Positions</span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {/* Asset Row 1: BNB */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[rgba(243,186,47,0.15)] text-[#F3BA2F]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3.2L16.2 7.4L18.4 5.2L12 0L5.6 5.2L7.8 7.4L12 3.2ZM20.8 7.6L18.6 9.8L20.8 12L23 9.8L20.8 7.6ZM12 8.4L15.6 12L12 15.6L8.4 12L12 8.4ZM3.2 7.6L1 9.8L3.2 12L5.4 9.8L3.2 7.6ZM12 16.6L7.8 12.4L5.6 14.6L12 21L18.4 14.6L16.2 12.4L12 16.6ZM20.8 12L18.6 14.2L20.8 16.4L23 14.2L20.8 12ZM3.2 12L1 14.2L3.2 16.4L5.4 14.2L3.2 12Z" />
                  </svg>
                </span>
                <div>
                  <div className="font-extrabold text-sm text-[var(--tx)]">BNB (Binance Smart Chain)</div>
                  <div className="text-xs font-semibold text-[var(--mut)]">Gas &amp; Native Asset · BEP-20</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num font-extrabold text-sm text-[var(--tx)]">1.45 BNB</div>
                <div className="text-xs font-bold text-[var(--mut)]">{hideBalance ? '••••••' : '$870.00'}</div>
              </div>
            </div>

            {/* Asset Row 2: $OKN Token */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[rgba(122,18,245,0.15)] text-[#7A12F5]">
                  <img src="/assets/okn-logo.png" alt="OKN" className="size-6 rounded-md object-contain" />
                </span>
                <div>
                  <div className="font-extrabold text-sm text-[var(--tx)]">$OKN Token</div>
                  <div className="text-xs font-semibold text-[#C9A6FF]">BEP-20 Presale Allocation</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num font-extrabold text-sm text-[var(--tx)]">693,333 $OKN</div>
                <div className="text-xs font-bold text-[var(--mut)]">{hideBalance ? '••••••' : '$416.00'}</div>
              </div>
            </div>

            {/* Asset Row 3: Partner Commission Vault */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[rgba(255,214,10,0.15)] text-[#FFD60A]">
                  <Users className="size-5" />
                </span>
                <div>
                  <div className="font-extrabold text-sm text-[var(--tx)]">Partner Commission Vault</div>
                  <div className="text-xs font-semibold text-[#2FBD8E]">14 Referrals · Instant Payout</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num font-extrabold text-sm text-[#2FBD8E]">0.238 BNB</div>
                <div className="text-xs font-bold text-[var(--mut)]">{hideBalance ? '••••••' : '$142.50'}</div>
              </div>
            </div>

            {/* Asset Row 4: OK Points */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[rgba(9,180,255,0.15)] text-[#09B4FF]">
                  <Coins className="size-5" />
                </span>
                <div>
                  <div className="font-extrabold text-sm text-[var(--tx)]">OK Points Balance</div>
                  <div className="text-xs font-semibold text-[#FFD60A]">Awaiting next Merkle commit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num font-extrabold text-sm text-[#09B4FF]">{formatPoints(points)} pts</div>
                <div className="text-xs font-bold text-[var(--mut)]">$3 BNB Claim Fee</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (span 2): Account Summary & Connected Payment Rails */}
        <div className="lg:col-span-2 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <h3 className="text-base font-extrabold text-[var(--tx)]">Account Summary &amp; Rails</h3>
            <span className="size-2 rounded-full bg-[#2FBD8E] shadow-[0_0_8px_#2FBD8E]" />
          </div>

          <div className="space-y-3.5 text-xs font-semibold text-[var(--mut)]">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--s2)] border border-[var(--line)]">
              <span>Web3 Identity</span>
              <span className="font-bold text-[var(--tx)]">@dev_user (DE)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--s2)] border border-[var(--line)]">
              <span>NOWPayments Gateway</span>
              <span className="font-bold text-[#00C2FF]">300+ Assets Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--s2)] border border-[var(--line)]">
              <span>Card Rails</span>
              <span className="font-bold text-[#2FBD8E]">Visa / Mastercard Ready</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--s2)] border border-[var(--line)]">
              <span>Network</span>
              <span className="font-bold text-[var(--tx)]">BNB Smart Chain (56)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[#7A12F5]/10 via-[#09B4FF]/10 to-[var(--s2)] p-4 text-[var(--tx)] flex items-start gap-3">
            <ShieldCheck className="size-5 text-[#2FBD8E] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold block text-[var(--tx)]">Non-Custodial Security</span>
              Your balances and on-chain claims are verified via cryptographic Merkle proofs and BEP-20 contracts.
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-[var(--tx)]">Deposit to Account</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--s2)] border border-[var(--line)] my-4">
              <div className="size-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                <QrCode className="size-36 text-black" />
              </div>
              <p className="text-xs font-semibold text-[var(--mut)] mt-3">Scan QR or copy address below</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">Deposit Address (BNB / BEP-20)</label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)]">
                <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">{currentAddress}</span>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1.5 rounded-lg bg-[#7A12F5] text-white text-xs font-bold shadow-sm hover:bg-[#8C38F7] cursor-pointer"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--mut)] mt-4 text-center">
              Only send BNB or BEP-20 tokens to this address on BNB Smart Chain.
            </p>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-[var(--tx)]">Withdraw Funds</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">Select Asset</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setWithdrawAsset('BNB')}
                    className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      withdrawAsset === 'BNB'
                        ? 'border-[#F3BA2F] bg-[#F3BA2F]/15 text-[#F3BA2F]'
                        : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)]'
                    }`}
                  >
                    BNB (1.45 Available)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawAsset('OKN')}
                    className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      withdrawAsset === 'OKN'
                        ? 'border-[#7A12F5] bg-[#7A12F5]/15 text-[#C9A6FF]'
                        : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)]'
                    }`}
                  >
                    $OKN (693K Available)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-xs font-mono font-bold text-[var(--tx)] outline-none focus:border-[#7A12F5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">Amount</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-sm font-bold text-[var(--tx)] outline-none focus:border-[#7A12F5]"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(withdrawAsset === 'BNB' ? '1.45' : '693333')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[var(--line)] text-[10px] font-extrabold text-[var(--tx)]"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#7A12F5] text-white text-xs font-extrabold shadow-md hover:bg-[#8C38F7] transition-all cursor-pointer mt-2"
              >
                Confirm Withdrawal
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
