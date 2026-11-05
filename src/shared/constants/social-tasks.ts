/**
 * constants/social-tasks.ts — the admin-facing social task matrix.
 *
 * Single source of truth for the task creation dialog: which platforms exist,
 * which actions each one offers, whether each action can be verified
 * AUTOMATICALLY by the verifier service (verificationMethod 'api'), and what
 * link each action needs.
 *
 * `automatic` mirrors the verifier's implemented provider modules
 * (apps/verifier/src/engine/registry.ts; a cross-check test lives in the
 * verifier test suite). When a platform module ships, flip its actions to
 * automatic here — until then the dialog and the admin API both refuse
 * automatic verification for it (Medium and Truth Social never get it).
 *
 * Client-safe: no node-only imports.
 */
import type { TaskType } from '../schemas/task';
import type { SocialAction, SocialPlatform } from '../schemas/verifier';

export interface SocialActionUrlDef {
  /** Whether members cannot complete the task without the link. */
  required: boolean;
  placeholder: string;
  hint?: string;
}

export interface SocialActionDef {
  action: SocialAction;
  /** Human task label, also the default task title in the dialog. */
  label: string;
  /** task.type the action maps onto. */
  taskType: TaskType;
  /** True when the verifier service can verify this action automatically. */
  automatic: boolean;
  /** How the verifier checks it (present when automatic). */
  mode?: 'instant' | 'hold' | 'event';
  /** Link the member needs; absent means the action needs no link at all. */
  url?: SocialActionUrlDef;
  /** Actions that match on content (message/comment/mention) accept a keyword. */
  keyword?: boolean;
  note?: string;
}

export interface SocialPlatformDef {
  platform: SocialPlatform;
  label: string;
  /** True when at least one action is automatic. */
  automaticAvailable: boolean;
  /** Shown in the dialog when automatic verification is unavailable. */
  note?: string;
  actions: SocialActionDef[];
}

/** Not-social bucket used by the dialog for referral / quiz / custom tasks. */
export const NON_SOCIAL_PLATFORM = 'other' as const;
export type DialogPlatform = SocialPlatform | typeof NON_SOCIAL_PLATFORM;

export const SOCIAL_TASK_MATRIX: SocialPlatformDef[] = [
  {
    platform: 'telegram',
    label: 'Telegram',
    automaticAvailable: true,
    actions: [
      {
        action: 'join_group',
        label: 'Join our Telegram group',
        taskType: 'social_follow',
        automatic: true,
        mode: 'hold',
        url: {
          required: false,
          placeholder: 'https://t.me/+K8ulLat-s3cyMjI0',
          hint: 'Members use this link to join. Verification checks the group configured in the verifier.',
        },
      },
      {
        action: 'join_channel',
        label: 'Join our Telegram channel',
        taskType: 'social_follow',
        automatic: true,
        mode: 'hold',
        url: {
          required: false,
          placeholder: 'https://t.me/OkNexusExchange',
          hint: 'Members use this link to join. Verification checks the channel configured in the verifier.',
        },
      },
      {
        action: 'message',
        label: 'Post a message in our Telegram group',
        taskType: 'social_post',
        automatic: true,
        mode: 'event',
        url: { required: false, placeholder: 'https://t.me/+K8ulLat-s3cyMjI0' },
        keyword: true,
      },
      {
        action: 'comment',
        label: 'Comment on our Telegram channel post',
        taskType: 'social_post',
        automatic: true,
        mode: 'event',
        url: {
          required: false,
          placeholder: 'https://t.me/OkNexusExchange/12',
          hint: 'Optional link to the channel post. Comments are matched in the linked discussion group.',
        },
        keyword: true,
      },
    ],
  },
  {
    platform: 'x',
    label: 'X (Twitter)',
    automaticAvailable: true,
    actions: [
      {
        action: 'follow',
        label: 'Follow us on X',
        taskType: 'social_follow',
        automatic: true,
        mode: 'hold',
        url: { required: true, placeholder: 'https://x.com/oknexusexchange' },
      },
      {
        action: 'retweet',
        label: 'Retweet our post on X',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://x.com/oknexusexchange/status/1234567890' },
      },
      {
        action: 'quote',
        label: 'Quote our post on X',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://x.com/oknexusexchange/status/1234567890' },
      },
      {
        action: 'reply',
        label: 'Reply to our post on X',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://x.com/oknexusexchange/status/1234567890' },
      },
      {
        action: 'mention',
        label: 'Post about us on X (mention or hashtag)',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: false, placeholder: 'https://x.com/oknexusexchange' },
        keyword: true,
      },
    ],
  },
  {
    platform: 'bluesky',
    label: 'Bluesky',
    automaticAvailable: true,
    actions: [
      {
        action: 'follow',
        label: 'Follow us on Bluesky',
        taskType: 'social_follow',
        automatic: true,
        mode: 'hold',
        url: { required: true, placeholder: 'https://bsky.app/profile/oknexusexchange.bsky.social' },
      },
      {
        action: 'like',
        label: 'Like our post on Bluesky',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://bsky.app/profile/oknexusexchange.bsky.social/post/abc123' },
      },
      {
        action: 'repost',
        label: 'Repost our post on Bluesky',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://bsky.app/profile/oknexusexchange.bsky.social/post/abc123' },
      },
      {
        action: 'reply',
        label: 'Reply to our post on Bluesky',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://bsky.app/profile/oknexusexchange.bsky.social/post/abc123' },
      },
      {
        action: 'quote',
        label: 'Quote our post on Bluesky',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://bsky.app/profile/oknexusexchange.bsky.social/post/abc123' },
      },
    ],
  },
  {
    platform: 'discord',
    label: 'Discord',
    automaticAvailable: true,
    note: 'Join and Boost verify automatically once members link their Discord account. Message and reaction tasks are manual review (they need live chat events).',
    actions: [
      {
        action: 'join_group',
        label: 'Join our Discord server',
        taskType: 'social_follow',
        automatic: true,
        mode: 'hold',
        url: { required: true, placeholder: 'https://discord.gg/ezgngF89p8' },
        note: 'Members link their Discord account via OAuth, which also proves membership.',
      },
      {
        action: 'message',
        label: 'Post a message in our Discord',
        taskType: 'social_post',
        automatic: false,
        url: { required: false, placeholder: 'https://discord.com/channels/...' },
        keyword: true,
      },
      {
        action: 'react',
        label: 'React to our Discord message',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://discord.com/channels/...' },
      },
      {
        action: 'boost',
        label: 'Boost our Discord server',
        taskType: 'social_follow',
        automatic: true,
        mode: 'instant',
        url: { required: false, placeholder: 'https://discord.gg/ezgngF89p8' },
      },
    ],
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    automaticAvailable: true,
    note: 'Comments verify automatically. Subscribe and like need each member\'s Google consent, so they stay manual for now.',
    actions: [
      {
        action: 'subscribe',
        label: 'Subscribe to our YouTube channel',
        taskType: 'social_follow',
        automatic: false,
        url: { required: true, placeholder: 'https://youtube.com/@oknexusexchange' },
      },
      {
        action: 'comment',
        label: 'Comment on our YouTube video',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://youtube.com/watch?v=...' },
      },
    ],
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    automaticAvailable: true,
    note: 'Members link their Facebook account via OAuth, then comment, reaction, and public-share tasks verify automatically.',
    actions: [
      {
        action: 'comment',
        automatic: true,
        mode: 'instant',
        label: 'Comment on our Facebook post',
        taskType: 'social_post',
        url: { required: true, placeholder: 'https://www.facebook.com/share/14sMsdMk6Xz/' },
      },
      {
        action: 'react',
        automatic: true,
        mode: 'instant',
        label: 'React to our Facebook post',
        taskType: 'social_post',
        url: { required: true, placeholder: 'https://www.facebook.com/share/14sMsdMk6Xz/' },
      },
      {
        action: 'share',
        automatic: true,
        mode: 'instant',
        label: 'Share our Facebook post (publicly)',
        taskType: 'social_post',
        url: { required: true, placeholder: 'https://www.facebook.com/share/14sMsdMk6Xz/' },
        note: 'Only public shares can be verified later; tell members to share publicly.',
      },
    ],
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    automaticAvailable: true,
    note: 'Members link their Instagram handle, then comment tasks verify automatically (needs the Meta app tokens on the verifier).',
    actions: [
      {
        action: 'comment',
        label: 'Comment on our Instagram post',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://www.instagram.com/p/...' },
      },
    ],
  },
  {
    platform: 'threads',
    label: 'Threads',
    automaticAvailable: true,
    note: 'Members link their Threads handle, then reply tasks verify automatically (needs the Meta app tokens on the verifier).',
    actions: [
      {
        action: 'reply',
        label: 'Reply to our Threads post',
        taskType: 'social_post',
        automatic: true,
        mode: 'instant',
        url: { required: true, placeholder: 'https://www.threads.com/@oknexusexchange/post/...' },
      },
    ],
  },
  {
    platform: 'medium',
    label: 'Medium',
    automaticAvailable: false,
    note: 'Medium has no API, so tasks are always verified by manual review.',
    actions: [
      {
        action: 'follow',
        label: 'Follow us on Medium',
        taskType: 'social_follow',
        automatic: false,
        url: { required: true, placeholder: 'https://medium.com/@oknexusexchange' },
      },
      {
        action: 'like',
        label: 'Clap for our Medium article',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://medium.com/@oknexusexchange/my-article-abc123' },
      },
      {
        action: 'comment',
        label: 'Comment on our Medium article',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://medium.com/@oknexusexchange/my-article-abc123' },
      },
    ],
  },
  {
    platform: 'truth_social',
    label: 'Truth Social',
    automaticAvailable: false,
    note: 'Truth Social has no open API, so tasks are always verified by manual review.',
    actions: [
      {
        action: 'follow',
        label: 'Follow us on Truth Social',
        taskType: 'social_follow',
        automatic: false,
        url: { required: true, placeholder: 'https://truthsocial.com/@OkNexusexchange' },
      },
      {
        action: 'like',
        label: 'Like our Truth Social post',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://truthsocial.com/@OkNexusexchange/posts/123' },
      },
      {
        action: 'repost',
        label: 'Repost our Truth Social post',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://truthsocial.com/@OkNexusexchange/posts/123' },
      },
      {
        action: 'comment',
        label: 'Comment on our Truth Social post',
        taskType: 'social_post',
        automatic: false,
        url: { required: true, placeholder: 'https://truthsocial.com/@OkNexusexchange/posts/123' },
      },
    ],
  },
];

const MATRIX_BY_PLATFORM = new Map(SOCIAL_TASK_MATRIX.map((p) => [p.platform, p]));

export function getSocialPlatformDef(platform: SocialPlatform): SocialPlatformDef | undefined {
  return MATRIX_BY_PLATFORM.get(platform);
}

/**
 * Server-side guard used by the admin task routes: is automatic verification
 * (verificationMethod 'api') actually available for this platform+action?
 * Accepts legacy platform aliases ('twitter' etc.) but never returns true for
 * platforms or actions whose verifier module is not live.
 */
export function isAutomaticSupported(
  platform: string | undefined | null,
  action: string | undefined | null,
): boolean {
  if (!platform || !action) return false;
  const lowered = platform.trim().toLowerCase();
  const normalized =
    lowered === 'x' || lowered === 'twitter' ? 'x' : lowered;
  const def = MATRIX_BY_PLATFORM.get(normalized as SocialPlatform);
  if (!def) return false;
  const actionDef = def.actions.find((a) => a.action === action.trim().toLowerCase());
  return Boolean(actionDef?.automatic);
}
