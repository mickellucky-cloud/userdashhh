import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Telegram Mini App / bot deep-link initData validation.
 *
 * Telegram docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC-SHA256("WebAppData", bot_token)
 * data_check_string = sorted URL-encoded key=value pairs (excluding "hash"), joined by \n
 * hash = HMAC-SHA256(data_check_string, secret_key) hex
 *
 * NEVER validate on the client. Always server-side.
 */
export interface ValidatedInitData {
  queryId?: string;
  user?: {
    id: number;
    is_bot?: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  };
  receiver?: Record<string, unknown>;
  chat?: Record<string, unknown>;
  chatType?: string;
  chatInstance?: string;
  startParam?: string;
  canSendAfter?: number;
  authDate: number; // seconds since epoch
  hash: string;
}

const MAX_AUTH_AGE_SECONDS = 86_400; // 24h — reject stale initData (plan §3.2)

/**
 * Validate initData from a Telegram Mini App / bot deep-link.
 * @param initData  the full query string ("tgWebAppData=..." or the inner query string)
 * @param botToken  the bot token
 * @param maxAgeSeconds  optional override for freshness window
 * @returns the parsed initData if valid, throws if invalid/tampered/expired
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = MAX_AUTH_AGE_SECONDS,
): ValidatedInitData {
  // Strip tgWebAppData wrapper if present
  const inner = stripTgWrapper(initData);
  const params = new URLSearchParams(inner);

  const hash = params.get('hash');
  if (!hash) throw new Error('validateInitData: missing hash');

  // Build data_check_string: sort keys, drop hash, URL-encode, join with \n
  const pairs: string[] = [];
  const collected: Record<string, string> = {};
  for (const key of [...params.keys()].sort()) {
    if (key === 'hash') continue;
    const val = params.get(key) ?? '';
    collected[key] = val;
    pairs.push(`${key}=${val}`);
  }
  const dataCheckString = pairs.join('\n');

  // secret_key = HMAC-SHA256("WebAppData", botToken)
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!safeEqualHex(computedHash, hash)) {
    throw new Error('validateInitData: invalid signature (forged or tampered)');
  }

  const authDate = Number(collected.auth_date);
  if (!authDate || !Number.isFinite(authDate)) {
    throw new Error('validateInitData: missing/invalid auth_date');
  }
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > maxAgeSeconds) {
    throw new Error(`validateInitData: auth_date too old (${age}s > ${maxAgeSeconds}s)`);
  }
  if (age < -60) {
    throw new Error('validateInitData: auth_date in the future');
  }

  const parsed: ValidatedInitData = {
    authDate,
    hash,
  };
  if (collected.query_id) parsed.queryId = collected.query_id;
  if (collected.user) {
    try {
      parsed.user = JSON.parse(collected.user);
    } catch {
      throw new Error('validateInitData: malformed user JSON');
    }
  }
  if (collected.start_param) parsed.startParam = collected.start_param;
  if (collected.chat_type) parsed.chatType = collected.chat_type;
  if (collected.chat_instance) parsed.chatInstance = collected.chat_instance;
  if (collected.can_send_after) parsed.canSendAfter = Number(collected.can_send_after);

  return parsed;
}

/**
 * Extract the tgWebAppData value if the input is a full tgWebApp* URL/query.
 * Otherwise return as-is.
 */
function stripTgWrapper(input: string): string {
  const full = new URLSearchParams(input.startsWith('?') ? input : `?${input}`);
  const nested = full.get('tgWebAppData');
  if (nested) return nested.startsWith('?') ? nested.slice(1) : nested;
  return input.startsWith('?') ? input.slice(1) : input;
}

/** Constant-time hex comparison to prevent timing attacks. */
function safeEqualHex(a: string, b: string): boolean {
  const normA = a.toLowerCase();
  const normB = b.toLowerCase();
  if (normA.length !== normB.length) return false;
  try {
    return timingSafeEqual(Buffer.from(normA, 'hex'), Buffer.from(normB, 'hex'));
  } catch {
    return false;
  }
}
