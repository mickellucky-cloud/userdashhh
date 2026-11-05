/**
 * app/error.tsx — root error boundary for the public site.
 *
 * Catches render errors in any route under the root layout EXCEPT the root
 * layout itself (that's global-error.tsx). Logs the error to the server.
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
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
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#8e8e93', marginBottom: '1.5rem', maxWidth: '28rem' }}>
        We hit an unexpected error while loading this page. The error has been logged.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: '#007aff',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #d1d1d6',
            background: 'transparent',
            color: '#000',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
