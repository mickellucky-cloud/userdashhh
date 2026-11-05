'use client';

/**
 * polymarket-agent/copier-hooks.ts — typed client calls to the web proxy
 * routes (/api/copier/*). Plain functions so tests and the panel stay
 * decoupled from data-fetching libraries.
 */

export interface CopierWallet {
  id: string;
  address: string;
  proxyWallet: string;
  origin: 'created' | 'imported_eoa' | 'imported_safe_owner';
  signatureType: 'eoa' | 'poly_gnosis_safe';
  status: string;
  createdAt?: string;
}

export interface CopierSubscription {
  id: string;
  traderAddress: string;
  status: 'preview' | 'live' | 'paused' | 'stopped';
  strategyConfig: {
    strategy: 'PERCENTAGE' | 'FIXED' | 'ADAPTIVE';
    copySize: number;
    maxOrderSizeUsd: number;
    minOrderSizeUsd: number;
  };
  createdAt?: string;
}

export interface CopierExecution {
  id: string;
  status: string;
  market: { asset?: string; slug?: string; side?: string };
  traderUsdcSize: string | number;
  sizing?: { finalAmount?: number; reasoning?: string } | null;
  createdAt?: string;
}

export interface CopierApiError {
  code: string;
  message: string;
}

async function call<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: CopierApiError }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = body.error as CopierApiError | undefined;
    return { ok: false, status: res.status, error: err ?? { code: 'unknown', message: `Request failed (${res.status})` } };
  }
  return { ok: true, status: res.status, data: body.data as T };
}

export function fetchWallet() {
  return call<CopierWallet>('/api/copier/wallet');
}

export function activateWallet(body: { origin: 'create' } | { origin: 'import_eoa'; privateKey: string } | { origin: 'import_safe_owner'; privateKey: string; proxyWallet: string }) {
  return call<CopierWallet>('/api/copier/wallet', { method: 'POST', body: JSON.stringify(body) });
}

export function fetchSubscriptions() {
  return call<CopierSubscription[]>('/api/copier/subscriptions');
}

export function createSubscription(body: { traderAddress: string; strategyConfig: CopierSubscription['strategyConfig'] }) {
  return call<CopierSubscription>('/api/copier/subscriptions', { method: 'POST', body: JSON.stringify(body) });
}

export function updateSubscription(id: string, body: { status?: CopierSubscription['status'] }) {
  return call<CopierSubscription>(`/api/copier/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function fetchExecutions(limit = 10) {
  return call<CopierExecution[]>(`/api/copier/executions?limit=${limit}`);
}

// ---------------------------------------------------------------------------
// Key export
// ---------------------------------------------------------------------------

export interface ExportedKey {
  privateKey: string;
  address: string;
}

/** One-time reveal of the wallet private key. Server audits and throttles. */
export function exportWalletKey() {
  return call<ExportedKey>('/api/copier/wallet/export-key', {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  });
}

// ---------------------------------------------------------------------------
// Withdrawals
// ---------------------------------------------------------------------------

export interface AllowlistAddress {
  id: string;
  address: string;
  label: string | null;
  effectiveAfter: string;
}

export interface Withdrawal {
  id: string;
  amountUsdc: string;
  status: 'requested' | 'executing' | 'done' | 'failed' | 'canceled';
  address: string;
  txHash: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export function fetchAllowlist() {
  return call<AllowlistAddress[]>('/api/copier/withdrawals/addresses');
}

export function addAllowlistAddress(body: { address: string; label?: string }) {
  return call<AllowlistAddress>('/api/copier/withdrawals/addresses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchWithdrawals(limit = 10) {
  return call<Withdrawal[]>(`/api/copier/withdrawals?limit=${limit}`);
}

export function requestWithdrawal(body: { address: string; amountUsdc: number }) {
  return call<Withdrawal>('/api/copier/withdrawals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// 2FA step-up
// ---------------------------------------------------------------------------

/** Verify a TOTP code at the web edge; sets the 5-minute freshness cookie. */
export function verifyCopier2fa(code: string) {
  return call<{ fresh: boolean }>('/api/copier/2fa', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export interface CopierBalances {
  address: string;
  usdc: string;
  pol: string;
  allowance: { usdcApproved: boolean; checkedAt: string } | null;
  openTokens: string;
  updatedAt: string;
}

export function fetchBalances() {
  return call<CopierBalances>('/api/copier/wallet/balances');
}

// ---------------------------------------------------------------------------
// Monetization: fees, entitlement, PRO billing
// ---------------------------------------------------------------------------

import { entitlementSchema, feeSummarySchema } from '@okn/shared';

export interface CopierFeeSummary {
  accruedUsdc: string;
  settledUsdc: string;
  waivedUsdc: string;
  outstandingUsdc: string;
  nextWithdrawalNetUsdc: string;
  nextWithdrawalMaxUsdc: string | null;
}

export interface CopierPricing {
  feeBpsFree: number;
  feeBpsPro: number;
  proPriceUsdc: string;
  proPeriodDays: number;
  freeSlots: number;
  proSlots: number;
}

export interface CopierEntitlement {
  tier: 'free' | 'pro';
  feeBps: number;
  slots: number;
  periodEnd: string | null;
  variant: string;
  billingEnabled: boolean;
  pricing: CopierPricing;
}

/** Payment instructions for the connected-wallet rail (pending intents). */
export interface CopierPaymentIntent {
  billingId: string;
  chainId: number;
  tokenAddress: string;
  treasuryAddress: string | null;
  amountUsdc: string;
  expiresAt: string | null;
}

export interface CopierBillingRecord {
  id: string;
  status: 'pending' | 'active' | 'expired' | 'void';
  paymentSource: 'copier_wallet' | 'connected_wallet';
  priceUsdc: string;
  periodStart?: string;
  periodEnd?: string;
  txHash?: string | null;
  chainId?: number | null;
  intentExpiresAt?: string | null;
  paymentIntent?: CopierPaymentIntent;
}

export function fetchFees(amountUsdc?: number) {
  const q = amountUsdc !== undefined ? `?amountUsdc=${amountUsdc}` : '';
  return call<CopierFeeSummary>(`/api/copier/fees${q}`).then((res) =>
    res.ok && res.data && feeSummarySchema.safeParse(res.data).success
      ? res
      : { ok: false as const, status: res.status, error: { code: 'bad_shape', message: 'Unexpected fee summary' } }
  );
}

export function fetchBilling() {
  return call<CopierEntitlement>('/api/copier/billing').then((res) =>
    res.ok && res.data && entitlementSchema.safeParse(res.data).success
      ? res
      : { ok: false as const, status: res.status, error: { code: 'bad_shape', message: 'Unexpected billing payload' } }
  );
}

export function subscribePro(body: { paymentSource: 'copier_wallet' | 'connected_wallet'; consent: true }) {
  return call<CopierBillingRecord>('/api/copier/billing', { method: 'POST', body: JSON.stringify(body) });
}

export function verifyProPayment(billingId: string, txHash: string) {
  return call<CopierBillingRecord>('/api/copier/billing/verify', {
    method: 'POST',
    body: JSON.stringify({ billingId, txHash }),
  });
}

/** Fire the Copier-tab view beacon (server dedupes per user per day). */
export function beaconCopierViewed(): void {
  void fetch('/api/copier/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'copier_viewed' }),
  }).catch(() => undefined);
}
