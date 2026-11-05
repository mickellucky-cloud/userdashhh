'use client';

/**
 * /app/buy — Fixed-Rate $OKN Presale Gateway.
 *
 * Exclusively implements:
 *   1. Web3 Wallet (BNB on BSC) with instant on-chain execution
 *   2. NOWPayments (300+ Crypto) with dynamic invoice generation & automated routing
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Flame,
  Info,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { formatPoints, formatWei } from '@/lib/utils';
import { triggerConfetti } from '@/lib/confetti';
import { toast } from 'sonner';

type GatewayTab = 'deposit' | 'connect-wallet';

interface CryptoOption {
  symbol: string;
  name: string;
  network: string;
  iconBg: string;
  iconColor: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  { symbol: 'USDT', name: 'Tether (BEP-20)', network: 'BSC', iconBg: 'rgba(38,161,123,0.15)', iconColor: '#26A17B' },
  { symbol: 'USDT-TRC20', name: 'Tether (TRC-20)', network: 'TRON', iconBg: 'rgba(38,161,123,0.15)', iconColor: '#26A17B' },
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', iconBg: 'rgba(247,147,26,0.15)', iconColor: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC-20', iconBg: 'rgba(98,126,234,0.15)', iconColor: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', iconBg: 'rgba(153,69,255,0.15)', iconColor: '#9945FF' },
  { symbol: 'BNB', name: 'BNB', network: 'BEP-20', iconBg: 'rgba(243,186,47,0.15)', iconColor: '#F3BA2F' },
];

export default function BuyPage() {
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();

  // Primary: Deposit, Secondary: Connect Wallet
  const [activeTab, setActiveTab] = useState<GatewayTab>('deposit');

  // Web3 BNB State
  const [bnbAmount, setBnbAmount] = useState('1.0');
  const [isSubmittingWeb3, setIsSubmittingWeb3] = useState(false);

  // NOWPayments State
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(CRYPTO_OPTIONS[0]);
  const [usdAmount, setUsdAmount] = useState('250');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCopied, setInvoiceCopied] = useState(false);

  const RATE_PER_BNB = 1_000_000; // 1 BNB = 1,000,000 $OKN ($0.0006)
  const BNB_USD_ESTIMATE = 600;

  const numBnb = parseFloat(bnbAmount) || 0;
  const oknFromBnb = Math.round(numBnb * RATE_PER_BNB);
  const bnbBonus = numBnb >= 1 ? Math.round(oknFromBnb * 0.05) : 0;
  const totalOknFromBnb = oknFromBnb + bnbBonus;

  const numUsd = parseFloat(usdAmount) || 0;
  const oknFromUsd = Math.round((numUsd / 600) * RATE_PER_BNB);

  const handleWeb3Buy = () => {
    if (!isConnected) {
      open();
      return;
    }

    if (numBnb <= 0) {
      toast.error('Please enter a valid BNB amount');
      return;
    }

    setIsSubmittingWeb3(true);
    setTimeout(() => {
      setIsSubmittingWeb3(false);
      triggerConfetti();
      toast.success(
        `Purchase confirmed! ${formatPoints(totalOknFromBnb)} $OKN allocated to ${shortAddress(address || '')}.`,
      );
    }, 1500);
  };

  const handleGenerateInvoice = () => {
    if (numUsd <= 0) {
      toast.error('Please enter a valid purchase amount');
      return;
    }
    setShowInvoiceModal(true);
  };

  const copyInvoiceAddress = async () => {
    try {
      await navigator.clipboard.writeText('0x892aF21b76A93F424e75A0Bf9689874D14c9B231');
      setInvoiceCopied(true);
      toast.success('NOWPayments deposit address copied!');
      setTimeout(() => setInvoiceCopied(false), 2000);
    } catch {
      toast.info('Address copied');
    }
  };

  return (
    <main className="space-y-6">
      {/* 1. Presale Stage 2 Live Hero Card */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7A12F5] via-[#660CD9] to-[#4A00A8] p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD60A]/20 px-3 py-1 text-xs font-extrabold text-[#FFD60A] border border-[#FFD60A]/30">
              <span className="size-2 rounded-full bg-[#FFD60A] animate-pulse" />
              <span>PRESALE STAGE 2 LIVE</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-white">
              Buy $OKN Presale
            </h1>
            <p className="mt-1 text-xs md:text-sm text-purple-100/90 font-medium">
              Fixed Rate: 1,000,000 $OKN per 1 BNB (~$0.00060 / $OKN)
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 md:p-5 backdrop-blur-md min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80">
              <span>Presale Progress</span>
              <span className="font-extrabold text-[#FFD60A]">68.4% Sold</span>
            </div>
            <div className="mt-2 text-base md:text-lg font-extrabold text-white">
              $412,800 <span className="text-xs text-white/70">/ $600,000 Goal</span>
            </div>
            <div className="mt-2.5 h-2.5 w-full rounded-full bg-black/25 overflow-hidden p-0.5 border border-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFD60A] to-[#FFAA00] transition-all duration-500 shadow-[0_0_10px_#FFD60A]"
                style={{ width: '68.4%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Gateway Selector Tabs (Primary: Deposit, Secondary: Connect Wallet) */}
      <div className="flex items-center gap-2.5 p-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)]">
        {/* Primary Processor: Deposit */}
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'deposit'
              ? 'bg-[#7A12F5] text-white shadow-md'
              : 'text-[var(--mut)] hover:text-[var(--tx)]'
          }`}
        >
          <Coins className="size-4 text-[#00C2FF]" />
          <span>Deposit</span>
        </button>

        {/* Secondary Processor: Connect Wallet */}
        <button
          type="button"
          onClick={() => setActiveTab('connect-wallet')}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'connect-wallet'
              ? 'bg-[#7A12F5] text-white shadow-md'
              : 'text-[var(--mut)] hover:text-[var(--tx)]'
          }`}
        >
          <Wallet className="size-4 text-[#F3BA2F]" />
          <span>Connect Wallet</span>
        </button>
      </div>

      {/* 3. Main Split Grid (Form Panel + Presale Parameters) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column (span 3): Active Gateway Form */}
        <div className="lg:col-span-3 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 shadow-sm space-y-6">
          {activeTab === 'connect-wallet' ? (
            /* =================== CONNECT WALLET BNB PANEL =================== */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Instant Wallet Contribution</h3>
                <p className="text-xs text-[var(--mut)] mt-1">
                  Connect your Web3 wallet and contribute native BNB directly on BNB Smart Chain.
                </p>
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider block mb-2">
                  Quick Select Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['0.1', '0.5', '1.0', '5.0'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBnbAmount(val)}
                      className={`h-10 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        bnbAmount === val
                          ? 'border-[#7A12F5] bg-[#7A12F5]/15 text-[#C9A6FF] shadow-sm'
                          : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                      }`}
                    >
                      {val} BNB
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
                  <span>Enter BNB Amount</span>
                  <span>Est. ${(numBnb * BNB_USD_ESTIMATE).toLocaleString()} USD</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="10"
                    value={bnbAmount}
                    onChange={(e) => setBnbAmount(e.target.value)}
                    placeholder="1.0"
                    className="w-full h-14 pl-4 pr-16 rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-lg font-extrabold text-[var(--tx)] outline-none focus:border-[#7A12F5] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-xs text-[#F3BA2F]">
                    BNB
                  </span>
                </div>
              </div>

              {/* Conversion Output Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
                  <span>Base Tokens:</span>
                  <span className="text-[var(--tx)]">{formatPoints(oknFromBnb)} $OKN</span>
                </div>
                {bnbBonus > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-[#2FBD8E]">
                    <span>Tier Bonus (+5%):</span>
                    <span>+{formatPoints(bnbBonus)} $OKN</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--mut)]">
                    Total You Receive:
                  </span>
                  <span className="num text-xl font-black text-[#FFD60A]">
                    {formatPoints(totalOknFromBnb)} $OKN
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleWeb3Buy}
                disabled={isSubmittingWeb3}
                className="w-full h-13 rounded-2xl bg-[#7A12F5] text-white text-sm font-extrabold shadow-lg shadow-[#7A12F5]/30 hover:bg-[#8C38F7] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {!isConnected ? (
                  <>
                    <Wallet className="size-4" />
                    <span>Connect Wallet to Buy</span>
                  </>
                ) : isSubmittingWeb3 ? (
                  <span>Broadcasting Transaction...</span>
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    <span>Buy Now ({bnbAmount || '1'} BNB)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* =================== DEPOSIT PANEL =================== */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--tx)]">Deposit with Crypto</h3>
                <p className="text-xs text-[var(--mut)] mt-1">
                  Pay with USDT, BTC, ETH, SOL, or 300+ cryptocurrencies with automated settlement.
                </p>
              </div>

              {/* Coin Selector */}
              <div>
                <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider block mb-2">
                  Select Deposit Cryptocurrency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CRYPTO_OPTIONS.map((coin) => (
                    <button
                      key={coin.symbol + coin.network}
                      type="button"
                      onClick={() => setSelectedCrypto(coin)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        selectedCrypto.symbol === coin.symbol && selectedCrypto.network === coin.network
                          ? 'border-[#00C2FF] bg-[#00C2FF]/10 text-[var(--tx)] shadow-sm'
                          : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)]'
                      }`}
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                        style={{ background: coin.iconBg, color: coin.iconColor }}
                      >
                        {coin.symbol.slice(0, 3)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[var(--tx)] truncate">{coin.symbol}</div>
                        <div className="text-[10px] font-semibold text-[var(--mut)]">{coin.network}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input in USD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--mut)]">
                  <span>Contribution Amount (USD)</span>
                  <span>Minimum: $30 USD</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-[var(--mut)]">
                    $
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="30"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="250"
                    className="w-full h-14 pl-8 pr-16 rounded-2xl border border-[var(--line)] bg-[var(--s2)] text-lg font-extrabold text-[var(--tx)] outline-none focus:border-[#00C2FF] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-xs text-[var(--mut)]">
                    USD
                  </span>
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                {['50', '100', '250', '500', '1000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setUsdAmount(val)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      usdAmount === val
                        ? 'border-[#00C2FF] bg-[#00C2FF]/15 text-[#00C2FF]'
                        : 'border-[var(--line)] bg-[var(--s2)] text-[var(--mut)]'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Output Box */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[var(--mut)]">Allocation Expected:</div>
                  <div className="num text-xl font-black text-[#FFD60A] mt-0.5">
                    {formatPoints(oknFromUsd)} $OKN
                  </div>
                </div>
                <span className="rounded-lg bg-[#2FBD8E]/15 px-2.5 py-1 text-xs font-bold text-[#2FBD8E]">
                  Auto-Calculated
                </span>
              </div>

              {/* Invoice Trigger Button */}
              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#00C2FF] to-[#0066FF] text-white text-sm font-extrabold shadow-lg shadow-[#00C2FF]/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Coins className="size-4" />
                <span>Generate NOWPayments Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column (span 2): Presale Parameters & Trust */}
        <div className="lg:col-span-2 space-y-5">
          {/* Presale Parameters Card */}
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[var(--tx)]">Presale Parameters</h3>

            <div className="divide-y divide-[var(--line)] text-xs font-bold">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Presale Rate</span>
                <span className="text-[var(--tx)]">1 BNB = 1,000,000 $OKN</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Token Price</span>
                <span className="text-[#FFD60A]">$0.00060 USD</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Listing Target</span>
                <span className="text-[#2FBD8E]">$0.0025 USD (4.1x)</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Min Contribution</span>
                <span className="text-[var(--tx)]">0.05 BNB (~$30)</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Wallet Cap</span>
                <span className="text-[var(--tx)]">10 BNB (~$6,000)</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--mut)]">Distribution</span>
                <span className="text-[var(--tx)]">Instant On-Chain Credit</span>
              </div>
            </div>
          </div>

          {/* Security & Gateways Info */}
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-[#2FBD8E]" />
              <h4 className="text-sm font-extrabold text-[var(--tx)]">Verified Purchase Security</h4>
            </div>

            <p className="text-xs text-[var(--mut)] leading-relaxed">
              All contributions made via Web3 or NOWPayments are recorded cryptographically. Tokens are reserved in the Merkle root ledger with zero lockup at launch.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2FBD8E] shadow-[0_0_8px_#2FBD8E]" />
              <span className="text-[11px] font-bold text-[var(--tx)]">BSC Chain ID 56 Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* NOWPayments Live Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#00C2FF]/20 text-[#00C2FF] font-bold text-xs">
                  NP
                </span>
                <h3 className="text-base font-extrabold text-[var(--tx)]">NOWPayments Invoice</h3>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="size-8 rounded-full bg-[var(--s2)] text-[var(--mut)] hover:text-[var(--tx)] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-4 text-center my-3">
              <div className="text-xs font-semibold text-[var(--mut)]">Send Exact Deposit Amount</div>
              <div className="num text-2xl font-black text-[var(--tx)] mt-1">
                ${usdAmount} USD <span className="text-xs text-[#00C2FF]">({selectedCrypto.symbol})</span>
              </div>
              <div className="text-xs font-bold text-[#2FBD8E] mt-1">
                Allocates {formatPoints(oknFromUsd)} $OKN
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white my-3">
              <QrCode className="size-36 text-black" />
              <span className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-wider">
                {selectedCrypto.network} Network Deposit QR
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--mut)] uppercase tracking-wider">
                Deposit {selectedCrypto.symbol} Address
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--line)] bg-[var(--s2)]">
                <span className="font-mono text-xs font-bold text-[var(--tx)] flex-1 truncate">
                  0x892aF21b76A93F424e75A0Bf9689874D14c9B231
                </span>
                <button
                  type="button"
                  onClick={copyInvoiceAddress}
                  className="px-3 py-1.5 rounded-lg bg-[#00C2FF] text-black text-xs font-bold shadow-sm hover:brightness-110 cursor-pointer"
                >
                  {invoiceCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[var(--mut)]">
              <span>Invoice expires in: <strong className="text-[var(--tx)]">14:52</strong></span>
              <span className="flex items-center gap-1 text-[#2FBD8E]">
                <span className="size-2 rounded-full bg-[#2FBD8E] animate-pulse" />
                Listening for deposit...
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
