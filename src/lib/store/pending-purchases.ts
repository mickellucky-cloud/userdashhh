/**
 * lib/store/pending-purchases.ts — optimistic purchase rows for the buy flow.
 *
 * A confirmed on-chain purchase should appear in the history table
 * immediately, but the indexer cron needs time to write the DB row. The buy
 * widget adds an "indexing" row here on receipt success; usePurchaseHistory
 * merges these ahead of the fetched rows (de-duplicated by txHash in
 * mergePurchaseRows, so the real indexed row replaces the optimistic one —
 * never a duplicate). The widget schedules history refetches and drops the
 * optimistic row once the fetched data contains the same txHash.
 *
 * Session-scoped in-memory state: a reload clears it (the fetched rows are
 * the source of truth).
 */
import { create } from 'zustand';
import type { PurchaseHistoryRow } from '../buy-guard';

type OptimisticPurchase = PurchaseHistoryRow & { indexing: true };

interface PendingPurchasesState {
  rows: OptimisticPurchase[];
  add: (row: OptimisticPurchase) => void;
  removeByTxHash: (txHash: string) => void;
}

export const usePendingPurchases = create<PendingPurchasesState>((set) => ({
  rows: [],
  add: (row) => set((s) => ({ rows: [row, ...s.rows] })),
  removeByTxHash: (txHash) =>
    set((s) => ({
      rows: s.rows.filter((r) => r.txHash.toLowerCase() !== txHash.toLowerCase()),
    })),
}));
