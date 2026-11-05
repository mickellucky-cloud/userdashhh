'use client';

/**
 * lib/auth/connected-rail.ts — the user's connected wallet as a payment
 * rail for copier PRO. Wagmi lives behind this single hook so the billing
 * UI stays decoupled (and testable); nothing custody-held ever moves here:
 * the user signs the USDC transfer from their own wallet.
 */
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { APP_CONFIG } from '@okn/shared';

export interface ConnectedRailTransfer {
  isConnected: boolean;
  transferUsdc(params: {
    tokenAddress: string;
    toAddress: string;
    amountUsdc: number;
  }): Promise<{ txHash: string }>;
}

export function useConnectedRailTransfer(): ConnectedRailTransfer {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return {
    isConnected: Boolean(address),
    async transferUsdc({ tokenAddress, toAddress, amountUsdc }) {
      const txHash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, parseUnits(String(amountUsdc), 6)],
        chainId: APP_CONFIG.chainId as 56 | 97,
      });
      return { txHash };
    },
  };
}
