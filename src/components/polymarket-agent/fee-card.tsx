'use client';

/**
 * polymarket-agent/fee-card.tsx — the Funds tab fee summary.
 *
 * Fees accrue per successful copy and settle from withdrawal proceeds, so
 * the card leads with outstanding debt and lifetime paid, plus the
 * one-line explainer so the model is never a surprise at withdrawal time.
 * Rendered as null while loading; degrades to a soft line on failure
 * (fees never block the rest of the tab).
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchFees, type CopierFeeSummary } from './copier-hooks';

export function FeeCard() {
  const t = useTranslations('dashboard.polymarketAgent.copier.fees');
  const [fees, setFees] = useState<CopierFeeSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchFees();
      if (cancelled) return;
      if (res.ok && res.data && typeof res.data.outstandingUsdc === 'string') {
        setFees(res.data);
      } else {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fees) {
    // Loading or failed: render nothing rather than a scary error card;
    // the withdrawal dialog still shows the exact net before submitting.
    return failed ? null : null;
  }

  const fmt = (v: string) => `$${Number(v).toFixed(2)}`;

  return (
    <Card>
      <CardContent className="space-y-3 p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Percent className="size-4" aria-hidden="true" />
          {t('title')}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">{t('outstanding')}</dt>
            <dd className="font-display text-xl font-bold tabular-nums" aria-live="polite">
              {fmt(fees.outstandingUsdc)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('lifetime')}</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{fmt(fees.settledUsdc)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('waived')}</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{fmt(fees.waivedUsdc)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">{t('explainer')}</p>
      </CardContent>
    </Card>
  );
}
