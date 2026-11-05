/**
 * lib/hooks/use-chain-guard.ts — F03 interactive half of the chain guard.
 *
 * Money-moving writes must NEVER broadcast on whatever chain the wallet
 * happens to be connected to (a Buy on Ethereum sends native ETH to the BSC
 * sale address — irreversible loss). Before every buy/claim:
 *   1. If the wallet is already on the configured chain → proceed.
 *   2. Otherwise prompt a network switch (wagmi adds the chain when the
 *      wallet does not know it) and ONLY proceed after the switch lands.
 * A rejected switch throws a rejection-shaped error the caller maps to the
 * same "rejected in your wallet" copy as signature dismissals.
 */
import { useAccount, useSwitchChain } from 'wagmi';
import { APP_CONFIG } from '@okn/shared';
import { isCorrectChain } from '@/lib/chain-guard';

export function useChainGuard() {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const configured = APP_CONFIG.chainId;

  return {
    configured,
    correct: isCorrectChain(chainId, configured),
    /** Throws (rejection-shaped) when the user dismisses the switch prompt. */
    ensureCorrectChain: async (): Promise<void> => {
      if (isCorrectChain(chainId, configured)) return;
      try {
        await switchChainAsync({ chainId: configured });
      } catch {
        // Normalize to the standard rejection phrasing so isUserRejection()
        // classifies a dismissed switch prompt exactly like a dismissed tx.
        throw new Error('User rejected the request to switch network.');
      }
    },
  };
}
