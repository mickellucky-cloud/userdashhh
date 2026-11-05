'use client';

/**
 * /app/trade-bot — AI Trading Agent (Coming soon).
 *
 * Preview of the planned automated signal surface: a grid of long / short
 * signal windows for crypto pairs, each showing pair, direction, entry, target,
 * stop, confidence and status. The bot itself is not built yet, so the whole
 * surface is non-interactive and marked Coming soon. Data shown is illustrative
 * sample content, not live signals.
 *
 * Design: the trading aesthetic is expressed through $OKN's existing semantic
 * tokens (ios-green for long, ios-red for short) rather than a separate dark
 * theme, so the page stays consistent with the rest of the dashboard.
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  PauseCircle,
  Sparkles,
  Target,
  ShieldCheck,
  Activity,
  Gauge,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Direction = 'long' | 'short';

interface Signal {
  pair: string;
  direction: Direction;
  entry: string;
  target: string;
  stop: string;
  confidence: number;
  timeframe: string;
}

/**
 * Illustrative sample signals. These are static placeholder values used only
 * to demonstrate the layout. When the bot ships, this list will be replaced
 * with live data from the bot's signal stream.
 */
const SAMPLE_SIGNALS: Signal[] = [
  { pair: 'BTC / USDT', direction: 'long', entry: '64,200', target: '67,500', stop: '62,800', confidence: 78, timeframe: '4h' },
  { pair: 'ETH / USDT', direction: 'short', entry: '3,480', target: '3,280', stop: '3,560', confidence: 64, timeframe: '4h' },
  { pair: 'SOL / USDT', direction: 'long', entry: '142.5', target: '158.0', stop: '136.0', confidence: 71, timeframe: '1h' },
  { pair: 'BNB / USDT', direction: 'long', entry: '588.0', target: '615.0', stop: '575.0', confidence: 66, timeframe: '4h' },
  { pair: 'XRP / USDT', direction: 'short', entry: '0.6240', target: '0.5880', stop: '0.6420', confidence: 59, timeframe: '1h' },
  { pair: 'ADA / USDT', direction: 'long', entry: '0.4520', target: '0.4850', stop: '0.4380', confidence: 73, timeframe: '4h' },
  { pair: 'DOGE / USDT', direction: 'short', entry: '0.1580', target: '0.1420', stop: '0.1660', confidence: 61, timeframe: '4h' },
  { pair: 'AVAX / USDT', direction: 'long', entry: '27.40', target: '30.50', stop: '26.20', confidence: 68, timeframe: '1h' },
  { pair: 'LINK / USDT', direction: 'long', entry: '14.80', target: '16.20', stop: '14.10', confidence: 70, timeframe: '4h' },
];

// Capability chips: icon paired with translated label. The label strings come
// from dashboard.tradeBot.capabilities (an array) via t.raw.
const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export default function TradeBotPage() {
  const t = useTranslations('dashboard.tradeBot');
  const capabilities = t.raw('capabilities') as unknown as string[];

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
        <div className="bg-gradient-to-br from-ios-indigo/10 via-ios-blue/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-indigo/10 text-ios-indigo">
                <Bot className="size-6" />
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

          {/* Capability chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {capabilities.map((label, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Activity;
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border/60"
                >
                  <Icon className="size-3.5 text-ios-blue" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Signal grid (preview, non-interactive) */}
      <section aria-label={t('signalPreviewAria')} className="relative">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('signalHeading')}
          </h2>
          <span className="text-xs text-muted-foreground">{t('sampleData')}</span>
        </div>

        {/* Dimmed, non-interactive wrapper communicates "this is not actionable yet". */}
        <div
          className="pointer-events-none select-none opacity-70"
          aria-disabled="true"
          aria-label={t('disabledAria')}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_SIGNALS.map((s) => (
              <SignalCard key={`${s.pair}-${s.direction}`} signal={s} />
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

function SignalCard({ signal }: { signal: Signal }) {
  const t = useTranslations('dashboard.tradeBot');
  const isLong = signal.direction === 'long';
  const dirIcon = isLong ? ArrowUpRight : ArrowDownRight;
  const DirIcon = dirIcon;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Header: pair + direction */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-mono text-sm font-semibold">{signal.pair}</p>
          <DirectionTag isLong={isLong} icon={DirIcon} />
        </div>

        {/* Timeframe + confidence */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('timeframe', { value: signal.timeframe })}</span>
          <ConfidenceMeter value={signal.confidence} />
        </div>

        {/* Levels */}
        <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
          <Level label={t('entry')} value={signal.entry} />
          <Level label={t('target')} value={signal.target} tone="pos" />
          <Level label={t('stop')} value={signal.stop} tone="neg" />
        </div>

        {/* Faux status footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PauseCircle className="size-3.5 text-ios-orange" />
            {t('pending')}
          </span>
          <span className="font-mono">#TB-{signal.pair.slice(0, 3).toUpperCase()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Direction tag carries color + icon + text, never color alone. */
function DirectionTag({
  isLong,
  icon: Icon,
}: {
  isLong: boolean;
  icon: typeof ArrowUpRight;
}) {
  const t = useTranslations('dashboard.tradeBot');
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        isLong ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-red/10 text-ios-red',
      )}
    >
      <Icon className="size-3.5" />
      {isLong ? t('long') : t('short')}
    </span>
  );
}

/** Confidence as a number + tinted bar, with text label for screen readers. */
function ConfidenceMeter({ value }: { value: number }) {
  const t = useTranslations('dashboard.tradeBot');
  const clamped = Math.max(0, Math.min(100, value));
  const tone =
    clamped >= 70 ? 'bg-ios-green' : clamped >= 60 ? 'bg-ios-blue' : 'bg-ios-orange';
  return (
    <div className="flex items-center gap-1.5" aria-label={t('confidenceAria', { value: clamped })}>
      <span className="tabular-nums text-muted-foreground">{clamped}%</span>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
        <span className={cn('block h-full rounded-full', tone)} style={{ width: `${clamped}%` }} />
      </span>
    </div>
  );
}

function Level({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg';
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-xs font-semibold tabular-nums',
          tone === 'pos' && 'text-ios-green',
          tone === 'neg' && 'text-ios-red',
          !tone && 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
