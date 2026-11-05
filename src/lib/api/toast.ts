'use client';

/**
 * api/toast.ts — graceful error toast helper.
 *
 * Every error surfaced to the user goes through here so we can guarantee:
 *   1. No raw JSON / HTML / stack text ever appears in a toast. `ApiError`
 *      messages are already sanitized by `client.ts` (parsed from the server's
 *      `{ error }` envelope, with a status-based generic fallback).
 *   2. Anything that is NOT an ApiError (network failure, wagmi/JS throw,
 *      user-rejected wallet signature, etc.) shows the caller-provided
 *      fallback string instead of leaking internals.
 *   3. The toast is always `destructive` and never throws, so error handling
 *      can never itself break the UI.
 */
import { toast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api/client';

/**
 * Show a user-safe destructive toast for `err`.
 *
 * @param err      The caught value (unknown — never assume it's an Error).
 * @param fallback Message to show when `err` is not an ApiError (e.g. a
 *                 translated string from the caller's i18n namespace). This is
 *                 also used when an ApiError somehow has an empty message.
 * @param title    Optional title; defaults to none to match the prevalent
 *                 description-only toast style in the app.
 */
export function toastError(err: unknown, fallback: string, title?: string): void {
  let description: string;
  try {
    description =
      err instanceof ApiError && err.message && err.message.trim()
        ? err.message
        : fallback;
  } catch {
    description = fallback;
  }

  try {
    toast(
      title
        ? { title, description, variant: 'destructive' }
        : { description, variant: 'destructive' },
    );
  } catch {
    // Toast infra unavailable (e.g. during SSR) — swallow so error handling
    // can never itself throw. The console is the last-resort record.
    console.error('toastError: failed to display toast', description);
  }
}

/**
 * True when `err` represents a user-initiated cancellation (e.g. they dismissed
 * a wallet signature request). Mirrors the check in buy-widget/claim-button so
 * callers can stay silent on cancellation and only toast real failures.
 */
export function isUserRejection(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? '';
  const code = (err as { code?: string }).code ?? '';
  return (
    code === 'ACTION_REJECTED' ||
    code === 'USER_REJECTED' ||
    /user rejected|rejected the request|cancelled/i.test(msg)
  );
}
