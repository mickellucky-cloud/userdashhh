/**
 * lib/env.ts — runtime env-var resolution with production guards.
 *
 * Centralizes NEXT_PUBLIC_* values that must be set for the app to function.
 * In production, a missing required value throws (fail-loud) rather than
 * silently falling back to a dev placeholder. In development, sensible
 * placeholders are used so local dev works without a full env.
 */

/**
 * Resolve the Telegram bot username. Required in production — if unset, the
 * Telegram Login Widget points at the wrong (test) bot and real auth silently
 * fails. The referral API route already guards this server-side; this helper
 * extends the guard to client-rendered surfaces (login page, landing hero).
 */
export function resolveBotUsername(): string {
  const username = process.env.NEXT_PUBLIC_BOT_USERNAME;
  if (!username && process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_BOT_USERNAME is not set. The Telegram login widget cannot render without it.',
    );
  }
  return username ?? 'okntest001_bot';
}
