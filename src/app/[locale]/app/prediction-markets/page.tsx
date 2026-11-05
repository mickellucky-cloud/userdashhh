'use client';

/**
 * /app/prediction-markets — Prediction Markets (Coming soon).
 *
 * Preview of the planned cross-protocol prediction-market browser: a grid of
 * sample market cards, each showing title, category, volume, liquidity and
 * live probability, plus a category filter row. Live trading is not available
 * yet, so the whole surface is non-interactive and marked Coming soon. Data
 * shown is illustrative sample content, not live markets.
 *
 * Design: mirrors the AI Trading Agent and Polymarket Agent pages so the three
 * agent/market surfaces feel like siblings. The prediction-market aesthetic
 * uses the existing semantic tokens (ios-green for YES-leading, ios-red for
 * NO-leading, ios-blue for neutral) so the page stays consistent with the rest
 * of the dashboard.
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  BarChart3,
  PauseCircle,
  Sparkles,
  TrendingUp,
  Droplets,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SampleMarket {
  title: string;
  category: string;
  volume: string;
  liquidity: string;
  yesProbability: number;
}

/**
 * Illustrative sample markets. Static placeholders used only to demonstrate
 * the layout. When the feature ships, this list will be replaced with live
 * data aggregated across protocols.
 */
const SAMPLE_MARKETS: SampleMarket[] = [
  { title: 'BTC above $70k by end of Q4', category: 'Crypto', volume: '$4.2M', liquidity: '$810k', yesProbability: 64 },
  { title: 'Next US presidential winner', category: 'Politics', volume: '$12.8M', liquidity: '$2.1M', yesProbability: 53 },
  { title: 'Fed cuts rates in next meeting', category: 'Economics', volume: '$6.4M', liquidity: '$1.3M', yesProbability: 71 },
  { title: 'Lakers make the playoffs', category: 'Sports', volume: '$1.9M', liquidity: '$420k', yesProbability: 47 },
  { title: 'SOL ETF approved this year', category: 'Crypto', volume: '$3.1M', liquidity: '$680k', yesProbability: 58 },
  { title: 'GDP growth above 3% in Q3', category: 'Economics', volume: '$2.5M', liquidity: '$510k', yesProbability: 33 },
];

export default function PredictionMarketsPage() {
  const t = useTranslations('dashboard.predictionMarkets');
  const categories = t.raw('categories') as unknown as string[];

  return (
    <main className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Badge variant="secondary" className="bg-ios-orange/10 text-ios-orange">
            <Sparkles data-icon="inline-start" />
            {t('comingSoon')}
          </Badge>
        }
      />

      {/* Hero / status banner */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-blue/10 via-ios-green/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-blue/10 text-ios-blue">
                <BarChart3 className="size-6" />
              </span>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold md:text-xl">{t('headline')}</p>
                <p className="max-w-prose text-sm text-muted-foreground">{t('body')}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <PauseCircle className="size-4 text-ios-orange" />
              <span>{t('statusBadge')}</span>
            </div>
          </div>

          {/* Category filter chips (preview only, non-interactive) */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((label, i) => (
              <span
                key={label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-border/60',
                  i === 0 ? 'bg-ios-blue/10 text-ios-blue' : 'bg-card/80 text-foreground/80',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Market preview grid (non-interactive) */}
      <section aria-label={t('title')} className="relative">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('headline')}
          </h2>
          <span className="text-xs text-muted-foreground">{t('comingSoon')}</span>
        </div>

        {/* Dimmed, non-interactive wrapper communicates "this is not actionable yet". */}
        <div
          className="pointer-events-none select-none opacity-70"
          aria-disabled="true"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_MARKETS.map((m, i) => (
              <MarketCard key={`${m.title}-${i}`} market={m} />
            ))}
          </div>
        </div>

        {/* Overlay CTA explaining the state and offering a way out. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <div className="pointer-events-auto m-3 max-w-md rounded-xl border border-border/70 bg-card/95 p-4 text-center shadow-lg backdrop-blur">
            <p className="text-sm font-medium">{t('overlayTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('overlayBody')}</p>
            <Button asChild variant="outline" size="sm" className="mt-3 cursor-pointer">
              <Link href="/app/portfolio">{t('backToPortfolio')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function MarketCard({ market }: { market: SampleMarket }) {
  const yesLeading = market.yesProbability >= 50;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Header: category + title */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ios-blue">
            {market.category}
          </p>
          <p className="text-sm font-semibold leading-snug">{market.title}</p>
        </div>

        {/* Volume + liquidity stats */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
          <Stat icon={TrendingUp} label="Volume" value={market.volume} />
          <Stat icon={Droplets} label="Liquidity" value={market.liquidity} />
        </div>

        {/* Probability bar */}
        <div className="border-t border-border/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className={cn('font-semibold', yesLeading ? 'text-ios-green' : 'text-ios-red')}>
              YES {market.yesProbability}%
            </span>
            <span className={cn('font-semibold', !yesLeading ? 'text-ios-green' : 'text-ios-red')}>
              NO {100 - market.yesProbability}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ios-red/20">
            <div
              className="h-full rounded-full bg-ios-green"
              style={{ width: `${market.yesProbability}%` }}
            />
          </div>
        </div>

        {/* Faux pending footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PauseCircle className="size-3.5 text-ios-orange" />
            preview
          </span>
          <span className="font-mono">soon</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">{value}</p>
    </div>
  );
}
