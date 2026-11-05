/**
 * app/[locale]/app/error.tsx — dashboard error boundary.
 *
 * Catches render errors inside the /app dashboard tree. The layout (sidebar,
 * header) is preserved — only the page content area shows the error card.
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        location: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        area: 'app',
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="rounded-2xl bg-destructive/10 p-3">
        <svg
          className="size-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold">Page error</h2>
      <p className="text-sm text-muted-foreground">
        This page hit an error. Your data is safe. The error has been logged.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-ios bg-ios-blue px-5 py-2.5 text-sm font-semibold text-white active:opacity-80"
        >
          Try again
        </button>
        <Link
          href="/app/portfolio"
          className="rounded-ios border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
