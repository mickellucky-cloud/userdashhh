/**
 * Copier schemas — the shared contract for the copy trading service.
 *
 * Strategy config is the multi-user port of the legacy bot's copyStrategy
 * model (apps/Polymarket-Copy-Trading-Bot-2/src/config/copyStrategy.ts):
 * PERCENTAGE / FIXED / ADAPTIVE sizing, tiered multipliers keyed by the
 * trader's order size, and hard safety caps. The same zod schema validates
 * dashboard input, service-side revalidation, and the jsonb columns.
 */
import { z } from 'zod';

const evmAddress = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 0x-prefixed 20-byte address');

/** Private key: 64 hex chars, with or without 0x; normalized to bare hex. */
const privateKey = z
  .string()
  .regex(/^(0x)?[0-9a-fA-F]{64}$/, 'must be 64 hex characters')
  .transform((v) => (v.startsWith('0x') ? v.slice(2) : v));

// ---------------------------------------------------------------------------
// Tiered multipliers
// ---------------------------------------------------------------------------

export interface MultiplierTier {
  /** Minimum trader order size in USD (inclusive). */
  min: number;
  /** Maximum trader order size in USD (exclusive); null = unbounded. */
  max: number | null;
  /** Multiplier applied to the base copy amount. */
  multiplier: number;
}

/**
 * Parse a tiered-multipliers string like "1-10:2.0,10-100:1.0,100+:0.1".
 * Ported verbatim in behavior from the legacy bot (parseTieredMultipliers):
 * bounded "min-max" ranges, "min+" for the unbounded final tier, sorted by
 * min, overlaps rejected, unbounded tier must be last.
 */
export function parseTieredMultipliers(tiersStr: string): MultiplierTier[] {
  if (!tiersStr || tiersStr.trim() === '') return [];

  const tiers: MultiplierTier[] = [];
  const tierDefs = tiersStr.split(',').map((t) => t.trim()).filter((t) => t);

  for (const tierDef of tierDefs) {
    const parts = tierDef.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid tier format: "${tierDef}". Expected "min-max:multiplier" or "min+:multiplier"`);
    }
    const range = parts[0] as string;
    const multiplierStr = parts[1] as string;

    const multiplier = Number.parseFloat(multiplierStr);
    if (Number.isNaN(multiplier) || multiplier < 0) {
      throw new Error(`Invalid multiplier in tier "${tierDef}": ${multiplierStr}`);
    }

    if (range.endsWith('+')) {
      const min = Number.parseFloat(range.slice(0, -1));
      if (Number.isNaN(min) || min < 0) {
        throw new Error(`Invalid minimum value in tier "${tierDef}": ${range}`);
      }
      tiers.push({ min, max: null, multiplier });
    } else if (range.includes('-')) {
      const minStr = range.split('-')[0];
      const maxStr = range.split('-')[1];
      if (!minStr || !maxStr) {
        throw new Error(`Invalid range format in tier "${tierDef}": "${range}"`);
      }
      const min = Number.parseFloat(minStr);
      const max = Number.parseFloat(maxStr);
      if (Number.isNaN(min) || min < 0) {
        throw new Error(`Invalid minimum value in tier "${tierDef}": ${minStr}`);
      }
      if (Number.isNaN(max) || max <= min) {
        throw new Error(`Invalid maximum value in tier "${tierDef}": ${maxStr} (must be > ${min})`);
      }
      tiers.push({ min, max, multiplier });
    } else {
      throw new Error(`Invalid range format in tier "${tierDef}". Use "min-max" or "min+"`);
    }
  }

  tiers.sort((a, b) => a.min - b.min);

  for (let i = 0; i < tiers.length - 1; i++) {
    const current = tiers[i] as MultiplierTier;
    const next = tiers[i + 1] as MultiplierTier;
    if (current.max === null) {
      throw new Error(`Tier with infinite upper bound must be last: ${current.min}+`);
    }
    if (current.max > next.min) {
      throw new Error(`Overlapping tiers: [${current.min}-${current.max}] and [${next.min}-${next.max ?? 'inf'}]`);
    }
  }

  return tiers;
}

/** Raw string form as entered in the dashboard, parsed into tier objects. */
export const tieredMultipliersInputSchema = z
  .string()
  .transform((v, ctx) => {
    try {
      return parseTieredMultipliers(v);
    } catch (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: err instanceof Error ? err.message : String(err) });
      return z.NEVER;
    }
  });

export const multiplierTierSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().positive().nullable(),
  multiplier: z.number().nonnegative(),
});

// ---------------------------------------------------------------------------
// Strategy config
// ---------------------------------------------------------------------------

export const copyStrategyEnum = z.enum(['PERCENTAGE', 'FIXED', 'ADAPTIVE']);

export const strategyConfigSchema = z
  .object({
    strategy: copyStrategyEnum,
    /** Meaning depends on strategy: % of trader order / fixed USD / base %. */
    copySize: z.number().positive(),
    adaptiveMinPercent: z.number().positive().optional(),
    adaptiveMaxPercent: z.number().positive().optional(),
    adaptiveThreshold: z.number().positive().optional(),
    tieredMultipliers: z.array(multiplierTierSchema).optional(),
    /** Legacy single multiplier; ignored when tieredMultipliers is set. */
    tradeMultiplier: z.number().positive().optional(),
    maxOrderSizeUsd: z.number().positive().default(100),
    minOrderSizeUsd: z.number().positive().default(1),
    maxPositionSizeUsd: z.number().positive().optional(),
    maxDailyVolumeUsd: z.number().positive().optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.strategy === 'PERCENTAGE' && cfg.copySize > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['copySize'],
        message: 'copySize for PERCENTAGE must be <= 100',
      });
    }
    if (cfg.minOrderSizeUsd > cfg.maxOrderSizeUsd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minOrderSizeUsd'],
        message: 'minOrderSizeUsd cannot exceed maxOrderSizeUsd',
      });
    }
    if (cfg.strategy === 'ADAPTIVE') {
      if (cfg.adaptiveMinPercent === undefined || cfg.adaptiveMaxPercent === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adaptiveMinPercent'],
          message: 'ADAPTIVE requires adaptiveMinPercent and adaptiveMaxPercent',
        });
      } else if (cfg.adaptiveMinPercent > cfg.adaptiveMaxPercent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['adaptiveMinPercent'],
          message: 'adaptiveMinPercent cannot exceed adaptiveMaxPercent',
        });
      }
    }
  });

export type StrategyConfig = z.infer<typeof strategyConfigSchema>;

// ---------------------------------------------------------------------------
// Wallets and activation
// ---------------------------------------------------------------------------

export const copierWalletOriginEnum = z.enum(['created', 'imported_eoa', 'imported_safe_owner']);
export const copierWalletStatusEnum = z.enum(['active', 'frozen', 'retired']);

export const walletActivationSchema = z.discriminatedUnion('origin', [
  z.object({ origin: z.literal('create') }),
  z.object({ origin: z.literal('import_eoa'), privateKey }),
  z.object({ origin: z.literal('import_safe_owner'), privateKey, proxyWallet: evmAddress }),
]);

export type WalletActivation = z.infer<typeof walletActivationSchema>;

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const copierSubscriptionStatusEnum = z.enum(['preview', 'live', 'paused', 'stopped']);

export const subscriptionCreateSchema = z.object({
  traderAddress: evmAddress,
  strategyConfig: strategyConfigSchema,
});

export const subscriptionUpdateSchema = z.object({
  strategyConfig: strategyConfigSchema.optional(),
  status: copierSubscriptionStatusEnum.optional(),
});

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

export const copierExecutionStatusEnum = z.enum([
  'received',
  'sized',
  'submitted',
  'filled',
  'partial',
  'skipped',
  'failed',
  'aborted_funds',
  'rate_limited',
]);

// ---------------------------------------------------------------------------
// Monetization: pricing config, billing, entitlement, fees
// ---------------------------------------------------------------------------

export const paymentSourceEnum = z.enum(['copier_wallet', 'connected_wallet']);
export type PaymentSource = z.infer<typeof paymentSourceEnum>;

export const copierBillingStatusSchema = z.enum(['pending', 'active', 'expired', 'void']);

export const copierPricingVariantSchema = z.object({
  name: z.string().regex(/^[a-z0-9_-]{1,32}$/, 'variant name is lowercase slug'),
  /** Traffic percentage; all variants together must not exceed 100. */
  share: z.number().int().min(0).max(100),
  feeBpsFree: z.number().int().min(0).max(1000).optional(),
  feeBpsPro: z.number().int().min(0).max(1000).optional(),
  proPriceUsdc: z.number().positive().optional(),
});
export type CopierPricingVariant = z.infer<typeof copierPricingVariantSchema>;

const bps = z.number().int().min(0).max(1000);
const slots = z.number().int().min(1).max(100);

/** Full pricing config as the service returns it (admin read + /billing/me). */
export const pricingConfigSchema = z.object({
  billingEnabled: z.boolean(),
  feeBpsFree: bps,
  feeBpsPro: bps,
  proPriceUsdc: z.number().positive(),
  proPeriodDays: z.number().int().min(1).max(365),
  freeSlots: slots,
  proSlots: slots,
  treasuryAddress: evmAddress.nullable(),
  treasuryBscAddress: evmAddress.nullable(),
  variants: z.array(copierPricingVariantSchema),
});
export type PricingConfig = z.infer<typeof pricingConfigSchema>;

/** Admin PATCH body: any subset of the config fields. */
export const pricingConfigUpdateSchema = z
  .object({
    billingEnabled: z.boolean().optional(),
    feeBpsFree: bps.optional(),
    feeBpsPro: bps.optional(),
    proPriceUsdc: z.number().positive().optional(),
    proPeriodDays: z.number().int().min(1).max(365).optional(),
    freeSlots: slots.optional(),
    proSlots: slots.optional(),
    treasuryAddress: evmAddress.nullable().optional(),
    treasuryBscAddress: evmAddress.nullable().optional(),
    variants: z.array(copierPricingVariantSchema).optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.variants) {
      const total = cfg.variants.reduce((sum, v) => sum + v.share, 0);
      if (total > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants'],
          message: `variant shares sum to ${total}; must not exceed 100`,
        });
      }
    }
  });

/** POST body to buy (or renew) a PRO period. Consent is not optional. */
export const billingSubscribeSchema = z.object({
  paymentSource: paymentSourceEnum,
  consent: z.literal(true),
});

/** POST body to confirm a connected-wallet payment with its tx hash. */
export const billingVerifySchema = z.object({
  billingId: z.string().uuid(),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'must be a 32-byte tx hash'),
});

/** Resolved per-user entitlement: what the tier allows right now. */
export const entitlementSchema = z.object({
  tier: z.enum(['free', 'pro']),
  feeBps: z.number().int().min(0).max(1000),
  slots: z.number().int().min(1).max(100),
  periodEnd: z.string().datetime().nullable(),
  variant: z.string().min(1),
  billingEnabled: z.boolean(),
});
export type Entitlement = z.infer<typeof entitlementSchema>;

/** USDC money amounts cross the wire as fixed-6 strings. */
export const feeSummarySchema = z.object({
  accruedUsdc: z.string(),
  settledUsdc: z.string(),
  waivedUsdc: z.string(),
  outstandingUsdc: z.string(),
  nextWithdrawalNetUsdc: z.string(),
  nextWithdrawalMaxUsdc: z.string().nullable(),
});
export type FeeSummary = z.infer<typeof feeSummarySchema>;
