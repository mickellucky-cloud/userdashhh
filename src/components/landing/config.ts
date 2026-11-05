/**
 * landing/config.ts — marketing page STRUCTURAL data only.
 *
 * All user-facing COPY (labels, headings, body text, roadmap items, allocation
 * names, etc.) now lives in apps/web/messages/{locale}.json and is consumed via
 * next-intl. This file keeps only the non-translatable values: numbers,
 * addresses, URLs, colors, percentages, and proper nouns (token name, chain
 * display name used as a brand identifier).
 *
 * Arrays here (allocations, roadmap) stay positionally aligned with the
 * matching arrays in messages/en.json so components can zip them together by
 * index. When you add a new allocation bucket or roadmap phase, add it in BOTH
 * places (same index).
 *
 * PLACEHOLDERS: every number and address here is editable marketing copy.
 * Confirm against the deployed contracts before mainnet launch.
 */
export const MARKETING = {
  tokenName: 'OKN',
  chain: 'BNB Smart Chain',
  // Reads the deployed address from env; falls back to a placeholder.
  contractAddress: process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS ?? '0x...',

  supply: '5,000,000,000',
  supplyValue: 5_000_000_000,
  claimFeeUsd: '$3',

  exchangeUrl: 'https://oknexusexchange.com/',

  // YouTube explainer video shown in its own landing section. This is the video
  // ID (the part after youtu.be/), structural data like an address - not copy.
  explainerVideoId: 'aeOaTnLNVIU',

  // KYC / audit trust signal. Drop the real AssureDeFi certificate URL in
  // place of the homepage link once the verification is published.
  kyc: {
    provider: 'AssureDeFi',
    // Links to the public verification page so visitors can confirm it.
    url: 'https://assuredefi.com/',
  },

  // Full social presence. Order matters — the sidebar renders top-to-bottom.
  // The `key` matches the icon name in landing/social-sidebar.tsx.
  socials: {
    telegram: 'https://t.me/OkNexusExchange',
    youtube: 'https://www.youtube.com/@OkNexusExchange',
    discord: 'https://discord.gg/Mt66r4Sg7r',
    facebook: 'https://www.facebook.com/share/1EkrNc96ep/?mibextid=wwXIfr',
    instagram: 'https://www.instagram.com/oknexusexchange',
    threads: 'https://www.threads.com/@oknexusexchange',
    bsky: 'https://bsky.app/profile/oknexusexchange.bsky.social',
    tiktok: 'https://www.tiktok.com/@oknexusexchange',
  },

  // Allocation breakdown (must sum to 100). Confirmed figures, 2026-07-24.
  // Labels live in messages/{locale}.json under tokenomics.allocations[i].
  // Colors + percentages stay here (not translatable).
  allocations: [
    { pct: 35, color: '#007aff' },
    { pct: 25, color: '#5856d6' },
    { pct: 15, color: '#5ac8fa' },
    { pct: 12, color: '#af52de' },
    { pct: 8, color: '#34c759' },
    { pct: 5, color: '#ff9500' },
  ],

  // Roadmap phases. Phase number, title, status, and items live in
  // messages/{locale}.json under roadmap.phases[i]. This array is kept only to
  // preserve count/order parity with the message catalog: each entry gives the
  // number of items in that phase (so the component knows how many message
  // keys to read without relying on a hardcoded count).
  roadmapPhases: [{ items: 3 }, { items: 3 }, { items: 2 }],
} as const;
