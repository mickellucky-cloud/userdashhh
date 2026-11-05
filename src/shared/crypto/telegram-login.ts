import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

/**
 * Telegram Login Widget auth_data validation.
 *
 * Telegram docs: https://core.telegram.org/widgets/login#checking-authorization
 *
 * DIFFERENT from Mini App initData:
 *   - secret_key = SHA256(bot_token)   (NOT HMAC-SHA256 with "WebAppData")
 *   - hash = HMAC-SHA256(data_check_string, secret_key)
 *
 * Used by PATH B (web-direct visitors clicking the Login Widget).
 */
export interface ValidatedLoginData {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: number;
  hash: string;
}

const MAX_AUTH_AGE_SECONDS = 86_400; // 24h

export function validateTelegramLogin(
  authData: Record<string, string> | string,
  botToken: string,
  maxAgeSeconds = MAX_AUTH_AGE_SECONDS,
): ValidatedLoginData {
  const params =
    typeof authData === 'string'
      ? Object.fromEntries(new URLSearchParams(authData))
      : { ...authData };

  const hash = params.hash;
  if (!hash) throw new Error('validateTelegramLogin: missing hash');

  // data_check_string: keys sorted alphabetically, excluding hash, as key=value\n
  const dataCheckString = Object.keys(params)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');

  // secret_key = SHA256(bot_token)  -- NOTE: different from initData
  const secretKey = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!safeEqualHex(computedHash, hash)) {
    throw new Error('validateTelegramLogin: invalid signature (forged or tampered)');
  }

  const authDate = Number(params.auth_date);
  if (!authDate || !Number.isFinite(authDate)) {
    throw new Error('validateTelegramLogin: missing/invalid auth_date');
  }
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > maxAgeSeconds) {
    throw new Error(`validateTelegramLogin: auth_date too old (${age}s > ${maxAgeSeconds}s)`);
  }
  if (age < -60) {
    throw new Error('validateTelegramLogin: auth_date in the future');
  }

  return {
    id: Number(params.id),
    firstName: params.first_name,
    lastName: params.last_name,
    username: params.username,
    photoUrl: params.photo_url,
    authDate,
    hash,
  };
}

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
