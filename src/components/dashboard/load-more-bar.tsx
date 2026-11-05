'use client';

/**
 * components/dashboard/load-more-bar.tsx — "Load more" footer for paginated
 * admin lists (G5). Shows the "showing N of M" count and a button to fetch the
 * next page. Hides itself when there's no next page or no items.
 */
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadMoreBar({
  shown,
  total,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  shown: number;
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  if (total === 0) return null;
  const remaining = Math.max(0, total - shown);
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-xs text-muted-foreground">
      <span>
        Showing <span className="tabular-nums">{shown}</span> of{' '}
        <span className="tabular-nums">{total}</span>
      </span>
      {hasNextPage ? (
        <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
          Load more{remaining > 0 ? ` (${remaining})` : ''}
        </Button>
      ) : null}
    </div>
  );
}
