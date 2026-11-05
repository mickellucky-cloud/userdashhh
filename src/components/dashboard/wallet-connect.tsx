/**
 * components/dashboard/wallet-connect.tsx — Phase 4.8 + security hardening
 * Reown AppKit connect button. When connected, signs a proof-of-ownership
 * message, then binds the wallet to the user.
 *
 * SECURITY: the wallet binding now requires an EIP-191 signature from the
 * connected wallet. The user signs a message containing their address + a
 * fresh timestamp; the server verifies it before binding.
 */
'use client';

import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { buildBindMessage, APP_CONFIG } from '@okn/shared';
import { useToast } from '@/components/ui/use-toast';
import { useMe } from '@/lib/hooks/use-me';

/**
 * AppKit is initialized client-only (AppKitInit, ssr:false), so the useAppKit
 * hooks cannot run during SSR. Gate the inner component behind a mounted check.
 */
export function WalletConnect() {
  const t = useTranslations('dashboard.walletConnect');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-ios bg-ios-blue px-6 py-3 font-semibold text-white opacity-60"
        disabled
      >
        {t('connect')}
      </button>
    );
  }
  return <WalletConnectInner />;
}

function WalletConnectInner() {
  const t = useTranslations('dashboard.walletConnect');
  const tToast = useTranslations('toasts.wallet');
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const me = useMe();
  const boundAddress = me.data?.user?.walletAddress ?? null;

  const [binding, setBinding] = useState(false);
  const [bound, setBound] = useState(false);
  const [signPending, setSignPending] = useState(false);

  const isAlreadyBound = Boolean(
    boundAddress && address && boundAddress.toLowerCase() === address.toLowerCase(),
  );
  const isWrongChain = Boolean(
    isConnected && chainId !== undefined && chainId !== APP_CONFIG.chainId,
  );

  const bindWallet = useCallback(
    async (walletAddress: string) => {
      setBinding(true);
      setSignPending(true);

      // Build the message with a fresh timestamp. The server verifies this
      // is within 10 minutes to prevent replay.
      const timestamp = Date.now();
      const message = buildBindMessage(walletAddress, timestamp, APP_CONFIG.chainId);

      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        setSignPending(false);
        setBinding(false);
        toast({
          title: tToast('signRequiredTitle'),
          description: tToast('signRequiredDesc'),
          variant: 'destructive',
        });
        return;
      }
      setSignPending(false);

      try {
        const res = await fetch('/api/wallet/bind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddress, message, signature }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setBound(true);
          void qc.invalidateQueries({ queryKey: ['me'] });
          if (data.rewardAwarded) {
            toast({
              title: '🎉 +50 OK Points Awarded!',
              description: 'Wallet successfully bound and 50 OK Points credited to your account balance.',
            });
          }
          setTimeout(() => setBound(false), 2000);
          return;
        }

        const body = await res.json().catch(() => null);
        const reason =
          (body && typeof body === 'object' && 'error' in body && String(body.error)) ||
          tToast('failedDesc', { status: res.status });
        toast({
          title: res.status === 409 ? tToast('conflictTitle') : tToast('failedTitle'),
          description:
            res.status === 409 ? tToast('conflictDesc') : reason,
          variant: 'destructive',
        });
      } catch {
        // Network-level failure (offline / dev server restart). Stay quiet: the
        // effect re-runs on the next connection change so a transient blip
        // doesn't spam the user.
      } finally {
        setBinding(false);
      }
    },
    [signMessageAsync, qc, toast, tToast],
  );

  // Auto-bind wallet when connected and not yet bound.
  useEffect(() => {
    if (!isConnected || !address) return;
    if (boundAddress?.toLowerCase() === address.toLowerCase()) return;
    void bindWallet(address);
  }, [isConnected, address, boundAddress, bindWallet]);

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <button
          type="button"
          onClick={() => open()}
          className="text-sm font-medium text-ios-blue hover:underline cursor-pointer"
          title="Click to manage wallet or disconnect"
        >
          {t('walletLabel', { addr: `${address.slice(0, 6)}...${address.slice(-4)}` })}
        </button>

        {isWrongChain && (
          <button
            type="button"
            onClick={async () => {
              try {
                await switchChainAsync({ chainId: APP_CONFIG.chainId });
              } catch {
                toast({
                  title: 'Network Switch Required',
                  description: `Please switch your wallet to ${APP_CONFIG.chainId === 97 ? 'BSC Testnet' : 'BSC Mainnet'}.`,
                  variant: 'destructive',
                });
              }
            }}
            className="rounded-ios bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            Switch to {APP_CONFIG.chainId === 97 ? 'BSC Testnet' : 'BSC Mainnet'}
          </button>
        )}

        {signPending && <p className="text-xs text-ios-gray">{t('signPending')}</p>}
        {binding && !signPending && <p className="text-xs text-ios-gray">{t('binding')}</p>}
        {(bound || isAlreadyBound) && <p className="text-xs text-green-600 font-medium">{t('bound')}</p>}

        {!isAlreadyBound && !binding && !signPending && (
          <button
            type="button"
            onClick={() => void bindWallet(address)}
            className="rounded-ios bg-ios-blue px-3 py-1.5 text-xs font-semibold text-white active:opacity-80"
          >
            Sign & Bind
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open()}
      className="rounded-ios bg-ios-blue px-6 py-3 font-semibold text-white active:opacity-80 cursor-pointer"
    >
      {t('connect')}
    </button>
  );
}
