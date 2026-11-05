'use client';

/**
 * polymarket-agent/agent-panel.tsx — the Agent tab content.
 *
 * Preview of the planned Polymarket prediction-event surface, carried over
 * unchanged from the original single-surface page: sample event positions
 * with YES/NO probabilities, conviction score, and a risk-sizing indicator.
 * The agent is not built yet, so the surface is non-interactive and marked
 * Coming soon; the data shown is illustrative sample content.
 */
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { PauseCircle, Activity, Target, Gauge, ShieldCheck, TrendingUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EventPosition {
  title: string;
  yesProbability: number;
  noProbability: number;
  conviction: number;
  size: 'S' | 'M' | 'L';
}

/**
 * Illustrative sample event positions. Static placeholders used only to
 * demonstrate the layout. When the agent ships, this list will be replaced
 * with live data from the agent's event stream.
 */
const SAMPLE_EVENTS: EventPosition[] = [
  { title: 'BTC above $70k by end of Q4', yesProbability: 64, noProbability: 36, conviction: 78, size: 'M' },
  { title: 'ETH flippening in 2026', yesProbability: 22, noProbability: 78, conviction: 41, size: 'S' },
  { title: 'Fed cuts rates in next meeting', yesProbability: 71, noProbability: 29, conviction: 82, size: 'L' },
  { title: 'SOL ETF approved this year', yesProbability: 58, noProbability: 42, conviction: 66, size: 'M' },
  { title: 'BNB above $650 this month', yesProbability: 49, noProbability: 51, conviction: 53, size: 'S' },
  { title: 'US recession declared in 2026', yesProbability: 38, noProbability: 62, conviction: 59, size: 'M' },
];

// Capability chips: icon paired with translated label. The label strings come
// from dashboard.polymarketAgent.capabilities (an array) via t.raw.
const CAPABILITY_ICONS = [Activity, Target, Gauge, ShieldCheck];

export function AgentPanel() {
  const t = useTranslations('dashboard.polymarketAgent');
  const capabilities = t.raw('capabilities') as unknown as string[];

  return (
    <div className="space-y-6">
      {/* Hero / status banner */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-purple/10 via-ios-blue/5 to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-purple/10 text-ios-purple">
                <TrendingUpDown className="size-6" />
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

      {/* Event preview grid (non-interactive) */}
      <section aria-label={t('headline')} className="relative">
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('headline')}
          </h2>
        </div>

        {/* Dimmed, non-interactive wrapper communicates "this is not actionable yet". */}
        <div
          className="pointer-events-none select-none opacity-70"
          aria-disabled="true"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_EVENTS.map((e, i) => (
              <EventCard key={`${e.title}-${i}`} event={e} />
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
    </div>
  );
}

function EventCard({ event }: { event: EventPosition }) {
  const yesIsStronger = event.yesProbability >= event.noProbability;
  const sizeTone =
    event.size === 'L' ? 'bg-ios-green' : event.size === 'M' ? 'bg-ios-blue' : 'bg-ios-gray3';

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Header: event title + size badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{event.title}</p>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase"
            aria-label={`Size ${event.size}`}
          >
            <span className={cn('size-1.5 rounded-full', sizeTone)} />
            {event.size}
          </span>
        </div>

        {/* YES / NO probabilities */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
          <Probability label="YES" value={event.yesProbability} tone={yesIsStronger ? 'pos' : 'neutral'} />
          <Probability label="NO" value={event.noProbability} tone={!yesIsStronger ? 'neg' : 'neutral'} />
        </div>

        {/* Conviction meter + faux pending footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PauseCircle className="size-3.5 text-ios-orange" />
            {event.conviction}% conviction
          </span>
          <span className="font-mono">preview</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Probability cell carries color + label + value, never color alone. */
function Probability({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'pos' | 'neg' | 'neutral';
}) {
  return (
    <div
      className={cn(
        'rounded-md px-2 py-1.5',
        tone === 'pos' && 'bg-ios-green/10',
        tone === 'neg' && 'bg-ios-red/10',
        tone === 'neutral' && 'bg-muted/50',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-bold tabular-nums',
          tone === 'pos' && 'text-ios-green',
          tone === 'neg' && 'text-ios-red',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}%
      </p>
    </div>
  );
}
