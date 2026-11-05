'use client';

/**
 * dashboard/data-state.tsx — loading skeletons, error, and empty states.
 * Every data-bound section and route renders geometry-matched skeletons
 * so users on slow or high-latency connections see immediate visual structure
 * with zero layout shift (CLS = 0).
 */
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton rows matching a stat-card grid. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading statistics"
      data-testid="stat-grid-skeleton"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-4 md:p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton rows matching a list/table body. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card
      role="status"
      aria-label="Loading list"
      data-testid="list-skeleton"
      className="divide-y divide-[var(--line)] border-[var(--line)] bg-[var(--s1)]"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 p-4">
          <Skeleton variant="circle" className="size-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      ))}
    </Card>
  );
}

/**
 * Full-screen AppShell Skeleton displayed during initial client hydration
 * so users on slow connections immediately see the sidebar, header, and
 * dashboard workspace structure instead of a blank screen.
 */
export function AppShellSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard workspace"
      data-testid="app-shell-skeleton"
      className="flex min-h-screen w-full bg-[var(--bg,#0b0b0e)] text-[var(--tx,#f5f5f7)]"
    >
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden md:flex w-[256px] shrink-0 flex-col border-r border-[var(--line,rgba(255,255,255,0.08))] bg-[var(--s1,#121216)] p-4 gap-4">
        <div className="flex items-center gap-3 px-1 py-1">
          <Skeleton className="size-9 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="space-y-1.5 mt-2 flex-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-[18px]" />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Sticky Header Skeleton */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line,rgba(255,255,255,0.08))] bg-[var(--s1,#121216)]/80 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-28 md:hidden" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-16 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton variant="circle" className="size-9" />
          </div>
        </header>

        {/* Main Viewport Content Skeleton */}
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 pb-24 md:pb-10">
          <PortfolioOverviewSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio (/app/portfolio) Skeleton — matches both Mobile and Desktop layouts.
 */
export function PortfolioOverviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading portfolio overview"
      data-testid="portfolio-overview-skeleton"
      className="space-y-4 md:space-y-6"
    >
      {/* Mobile Hero & Switcher Skeleton */}
      <div className="block md:hidden space-y-4">
        <div className="rounded-b-[32px] -mx-4 -mt-6 bg-gradient-to-br from-[#7A12F5]/40 via-[#660CD9]/30 to-[#4A00A8]/30 p-5 pt-6 border-b border-[var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton variant="pill" className="h-6 w-28" />
          </div>
          <Skeleton className="h-12 w-36 mb-4" />
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-[22px]" />
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[148px] rounded-[24px]" />
          <Skeleton className="h-[148px] rounded-[24px]" />
        </div>
      </div>

      {/* Desktop Header + Asset Hero + KPI Grid + Split Columns */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-end justify-between gap-4 pb-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>

        {/* Asset Valuation Hero Card Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="size-[54px] rounded-[16px]" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
            </div>
          </div>
          <Skeleton className="h-16 w-64 rounded-[18px]" />
        </div>

        {/* 4 KPI Stat Cards */}
        <StatGridSkeleton count={4} />

        {/* Daily Streak Card Skeleton */}
        <div className="flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-[14px]" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="w-3.5 h-9 rounded-md" />
            ))}
          </div>
        </div>

        {/* Announcement Banner Skeleton */}
        <Skeleton className="h-32 w-full rounded-[24px]" />

        {/* Two-Column Split Grid (3fr : 2fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="space-y-5 lg:col-span-3">
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-11 w-32 rounded-xl" />
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3.5 w-48" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-[var(--line)] bg-[var(--s2)]">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History Table Skeleton */}
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <Skeleton className="h-9 w-48 rounded-xl" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Log Tab Skeleton
 */
export function ActivityLogSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading activity log"
      data-testid="activity-log-skeleton"
      className="space-y-6"
    >
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-7 md:p-9 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-56" />
          </div>
          <Skeleton className="h-16 w-44 rounded-2xl" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="pill" className="h-9 w-20" />
        <Skeleton variant="pill" className="h-9 w-28" />
        <Skeleton variant="pill" className="h-9 w-24" />
      </div>
      <ListSkeleton rows={5} />
    </div>
  );
}

/**
 * Buy Page (/app/buy) Skeleton
 */
export function BuyPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading presale gateway"
      data-testid="buy-page-skeleton"
      className="space-y-6"
    >
      {/* Hero Banner Skeleton */}
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton variant="pill" className="h-6 w-44" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-5 min-w-[240px] space-y-2.5">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-6 w-40" />
            <Skeleton variant="pill" className="h-2.5 w-full" />
          </div>
        </div>
      </div>

      {/* Gateway Switcher Tabs Skeleton */}
      <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl border border-[var(--line)] bg-[var(--s2)]">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>

      {/* 3:2 Split Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-13 w-full rounded-2xl" />
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-[var(--line)]/50 last:border-0">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tasks Page (/app/tasks) Skeleton
 */
export function TasksPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      data-testid="tasks-page-skeleton"
      className="space-y-6"
    >
      {/* Hero Banner Skeleton */}
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-11 w-52" />
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--s2)] p-5 min-w-[220px] space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton variant="pill" className="h-2 w-full" />
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="pill" className="h-9 w-24" />
        ))}
      </div>

      {/* 2-Column Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[var(--line)] bg-[var(--s1)] p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-11 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Wallet Holdings Page (/app/wallet) Skeleton
 */
export function WalletPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading wallet holdings"
      data-testid="wallet-page-skeleton"
      className="space-y-6"
    >
      {/* Header + Switcher */}
      <div className="hidden md:flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>

      {/* Net Asset Value Hero Card */}
      <div className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-40" />
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-11 w-48" />
              <Skeleton className="h-6 w-28 rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-36 rounded-2xl" />
            <Skeleton className="h-10 w-32 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[var(--line)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <StatGridSkeleton count={4} />

      {/* Asset Allocation Bar */}
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton variant="pill" className="h-4 w-full" />
      </div>

      {/* 3:2 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--line)]/50 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3.5">
          <Skeleton className="h-5 w-44" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Referral Partner Page (/app/referral) Skeleton
 */
export function ReferralPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading referral partner program"
      data-testid="referral-page-skeleton"
      className="space-y-6"
    >
      {/* Partner Hero Skeleton */}
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Unique Referral Link Card */}
      <div className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-6 sm:p-7 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-2xl" />
            <Skeleton className="size-12 rounded-2xl" />
            <Skeleton className="size-12 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Referral Statistics Card */}
      <div className="rounded-[26px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-7 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-8 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Claim Page (/app/claim) Skeleton
 */
export function ClaimPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading claim page"
      data-testid="claim-page-skeleton"
      className="space-y-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-8 flex flex-col items-center gap-3">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-12 w-48" />
        <Skeleton variant="pill" className="h-6 w-24" />
      </div>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-[22px]" />
        <Skeleton className="h-64 rounded-[22px]" />
      </div>
      <Skeleton className="h-36 w-full rounded-[22px]" />
    </div>
  );
}

/**
 * Leaderboard Page (/app/leaderboard) Skeleton
 */
export function LeaderboardPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading leaderboard"
      data-testid="leaderboard-page-skeleton"
      className="space-y-6"
    >
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl -mt-2" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <ListSkeleton rows={6} />
    </div>
  );
}

/**
 * Missions Page (/app/missions) Skeleton
 */
export function MissionsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading missions"
      data-testid="missions-page-skeleton"
      className="space-y-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-72" />
              </div>
              <Skeleton variant="pill" className="h-6 w-24" />
            </div>
            <Skeleton variant="pill" className="h-2.5 w-full" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Agents Hub Page (/app/agents) Skeleton
 */
export function AgentsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading autonomous agents suite"
      data-testid="agents-page-skeleton"
      className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-12"
    >
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--s1)] p-6 md:p-8 space-y-3">
        <Skeleton variant="pill" className="h-6 w-44" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-64" />
              </div>
            </div>
            <Skeleton variant="pill" className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * Polymarket Agent Page (/app/polymarket-agent) Skeleton
 */
export function PolymarketPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading Polymarket agent"
      data-testid="polymarket-page-skeleton"
      className="space-y-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-72 rounded-xl" />
      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Settings Page (/app/settings) Skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading account settings"
      data-testid="settings-page-skeleton"
      className="space-y-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--s1)] p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="circle" className="size-14" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('dashboard.dataState');
  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-sm">{message ?? t('error')}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            {t('retry')}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export function WarningBanner({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('dashboard.dataState');
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
    >
      <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-200">
        {message ?? t('staleWarning')}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="size-3.5" />
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {message ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {action}
    </Card>
  );
}
