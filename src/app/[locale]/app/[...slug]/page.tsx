/**
 * app/app/[...slug]/page.tsx — catch-all for unknown /app/* URLs.
 *
 * Why this exists: Next.js's App Router only renders a nested not-found.tsx
 * when notFound() is explicitly CALLED inside that segment. An unmatched URL
 * like /app/typo-page otherwise falls through to the ROOT app/not-found.tsx
 * (the landing 404), which links to "/" instead of "/app/portfolio".
 *
 * This catch-all sits below every real /app/* route (they match first), so it
 * only renders when nothing else did. Calling notFound() here raises the
 * dashboard-scoped boundary at app/app/not-found.tsx, which renders INSIDE the
 * dashboard shell (sidebar, header, avatar) with a CTA to /app/portfolio.
 *
 * Because this route lives under app/app/, the layout's requireUser() guard
 * still applies — unauthenticated visitors are redirected to /login before they
 * ever reach this page, so no auth check is needed here.
 */
import { notFound } from 'next/navigation';

export default function CatchAll() {
  notFound();
}
