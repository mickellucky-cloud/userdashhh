'use client';

/**
 * landing/social-sidebar.tsx — fixed vertical social rail on the left edge.
 *
 * Stays pinned during scroll (position: fixed), mirrors the layout in the
 * reference image: a thin vertical column of brand icons running down the
 * left side of the viewport, hidden on small screens (would overlap content).
 *
 * Each link:
 *   - opens in a new tab (target=_blank, rel=noreferrer)
 *   - shows a tooltip on hover (title attr — native, zero JS)
 *   - has a subtle hover lift + brand-color tint
 *
 * Brand icons: lucide-react provides Youtube, Facebook, Instagram, Twitter,
 * Send (Telegram stand-in), MessageCircle, Hash, AtSign, Globe. Lucide
 * dropped Discord / TikTok / Threads / Bluesky (trademark concerns), so
 * those are inlined as small <svg> paths in BRAND_ICONS below.
 *
 * Stable Animation During Development Hot Reload (AGENTS.md rule):
 *   This component holds no internal animation state — it's pure markup
 *   keyed off the static MARKETING.socials object. Re-renders from HMR
 *   don't reset anything because there's nothing to reset.
 */
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactElement } from 'react';
import {
  Youtube,
  Facebook,
  Instagram,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MARKETING } from './config';

/** Inline SVG brand icons for the platforms lucide doesn't ship.
 *  Each is a 24x24 viewBox single-path glyph matching the brand's mark. */
function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TiktokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.06.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function ThreadsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.461-.218-3.464-.789-1.255-.715-2.005-1.902-2.114-3.346-.111-1.484.425-2.835 1.503-3.807.965-.871 2.322-1.416 4.035-1.619 1.024-.121 1.975-.072 2.792.027-.105-.683-.378-1.19-.815-1.522-.514-.39-1.308-.585-2.359-.585-.956 0-1.962.243-2.798.678l-.86-1.84c1.083-.554 2.429-.847 3.685-.847h.182c2.169.043 4.265.84 5.07 3.094 1.392-.611 2.844-.587 4.058-.043 1.469.657 2.497 1.956 2.953 3.752.634 2.495.144 5.05-1.426 7.014-1.59 1.987-4.038 2.992-7.218 3.018h-.014zm-.708-9.465c-.286.005-.57.022-.852.053-1.95.214-2.962 1.022-2.873 2.309.075 1.084 1.053 1.746 2.604 1.746l.296-.01c1.594-.085 3.278-.74 3.466-4.005-.494-.058-1.001-.103-1.495-.103l-.146.01z" />
    </svg>
  );
}

function BlueskyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5.025 4.044C6.497 5.149 8.073 7.394 8.65 8.566c.577 1.172 1.135 2.54 1.135 4.082 0 1.543-.444 2.673-1.135 4.083-.587 1.196-2.153 3.417-3.625 4.522C3.553 22.357 1.494 23.001.001 22.794c0-1.543.69-3.532 1.832-5.013 1.143-1.482 3.183-2.831 4.965-3.748 1.782-.917 3.183-1.482 5.494-2.057.691-.182 1.382-.273 2.073-.273 2.073 0 3.938.6 5.495 1.543 1.556.943 2.873 2.314 3.625 3.748 1.143 1.482 1.832 3.471 1.832 5.013-1.493.207-3.552-.437-5.024-1.541-1.472-1.105-3.038-3.326-3.625-4.522-.691-1.41-1.135-2.54-1.135-4.083 0-1.542.558-2.91 1.135-4.082.577-1.172 2.153-3.417 3.625-4.522C19.447 1.643 21.506 1 23 .207c-1.392-.182-3.183-.207-4.965.391-1.782.598-3.183 1.464-4.965 2.946C11.288 5.026 10.292 6.5 9.49 8.293c-.69 1.542-1.135 2.946-1.135 4.488 0 1.543.444 2.947 1.135 4.488.802 1.793 1.798 3.267 3.58 4.749 1.782 1.482 3.183 2.348 4.965 2.946 1.782.598 3.573.573 4.965.391-1.494-.793-3.553-1.436-5.025-2.541z" />
    </svg>
  );
}

type IconSpec =
  | { kind: 'lucide'; Icon: LucideIcon }
  | { kind: 'custom'; Component: (props: { size?: number }) => ReactElement };

const ICONS: Record<string, IconSpec> = {
  telegram: { kind: 'lucide', Icon: Send },
  youtube: { kind: 'lucide', Icon: Youtube },
  discord: { kind: 'custom', Component: DiscordIcon },
  facebook: { kind: 'lucide', Icon: Facebook },
  instagram: { kind: 'lucide', Icon: Instagram },
  threads: { kind: 'custom', Component: ThreadsIcon },
  bsky: { kind: 'custom', Component: BlueskyIcon },
  tiktok: { kind: 'custom', Component: TiktokIcon },
};

const LABELS: Record<string, string> = {
  telegram: 'telegram',
  youtube: 'youtube',
  discord: 'discord',
  facebook: 'facebook',
  instagram: 'instagram',
  threads: 'threads',
  bsky: 'bsky',
  tiktok: 'tiktok',
};

export function SocialSidebar() {
  const t = useTranslations('socialSidebar');
  const reduceMotion = useReducedMotion();
  const entries = Object.entries(MARKETING.socials);

  return (
    <motion.nav
      aria-label={t('ariaLabel')}
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed top-1/2 right-4 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      <ul className="pointer-events-auto flex flex-col items-center gap-1.5 rounded-full border border-black/5 bg-white/70 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md">
        {entries.map(([key, url]) => {
          const spec = ICONS[key];
          if (!spec) return null;
          const messageKey = LABELS[key];
          const label = messageKey ? t(`labels.${messageKey}`) : key;
          return (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                title={label}
                aria-label={label}
                className="group flex size-9 items-center justify-center rounded-full text-ios-label-secondary transition-all hover:bg-ios-gray6 hover:text-ios-blue active:scale-95 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {spec.kind === 'lucide' ? (
                  <spec.Icon size={18} strokeWidth={1.75} />
                ) : (
                  <spec.Component size={18} />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

/**
 * Compact horizontal row of social icons — the same links as <SocialSidebar />
 * but laid out as a wrapping row for places where the fixed vertical rail is
 * hidden (mobile/tablet). Used inside the mobile nav menu so social links stay
 * reachable without scrolling to the footer.
 */
export function SocialIconRow() {
  const t = useTranslations('socialSidebar');
  const entries = Object.entries(MARKETING.socials);
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {entries.map(([key, url]) => {
        const spec = ICONS[key];
        if (!spec) return null;
        const messageKey = LABELS[key];
        const label = messageKey ? t(`labels.${messageKey}`) : key;
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title={label}
              aria-label={label}
              className="flex size-9 items-center justify-center rounded-full text-ios-label-secondary transition-all hover:bg-ios-gray6 hover:text-ios-blue active:scale-95 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {spec.kind === 'lucide' ? (
                <spec.Icon size={18} strokeWidth={1.75} />
              ) : (
                <spec.Component size={18} />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
