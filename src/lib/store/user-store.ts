/**
 * lib/store/user-store.ts — Phase 4.10
 * Zustand store for client-side user state.
 * Holds balance, wallet address, and task completion state.
 */
import { create } from 'zustand';

interface UserState {
  /** User's OKN token balance (raw wei as string) */
  balance: string | null;
  /** User's bound wallet address */
  walletAddress: string | null;
  /** Whether the user is an admin */
  isAdmin: boolean;
  /** Set the balance */
  setBalance: (balance: string | null) => void;
  /** Set the wallet address */
  setWalletAddress: (address: string | null) => void;
  /** Set admin status */
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  balance: null,
  walletAddress: null,
  isAdmin: false,
  setBalance: (balance) => set({ balance }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));
