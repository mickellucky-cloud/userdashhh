/**
 * lib/hooks/use-sale.ts — sale config + purchase history.
 *
 * usePurchaseHistory merges the optimistic "indexing" rows (added by the buy
 * widget on receipt success) ahead of the fetched rows. mergePurchaseRows
 * de-duplicates by txHash, so once the indexer row with the same hash lands
 * the optimistic row disappears — the purchase never shows twice.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { mergePurchaseRows, type PurchaseHistoryRow } from '../buy-guard';
import { usePendingPurchases } from '../store/pending-purchases';

export function useSalePrice() {
  return useQuery({ queryKey: ['sale-price'], queryFn: api.getSalePrice });
}

export function usePurchaseHistory() {
  const optimistic = usePendingPurchases((s) => s.rows);
  return useQuery({
    queryKey: ['purchase-history'],
    queryFn: api.getPurchaseHistory,
    select: (fetched): PurchaseHistoryRow[] => mergePurchaseRows(optimistic, fetched),
  });
}
