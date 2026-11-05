import { z } from 'zod';

// === PURCHASES (TokenSale Bought events) ===
export const purchaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  buyerWallet: z.string(),
  bnbAmount: z.bigint(),
  oknAmount: z.bigint(),
  rate: z.bigint(),
  txHash: z.string(),
  blockNumber: z.bigint().nullable(),
  createdAt: z.date(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

// === SALE CONFIG (single-row table, id=1) ===
// NOTE: wei amounts stored as numeric (string) in Postgres because they can
// exceed bigint range (max ~9.2e18). We validate as string here.
// priceUsd: the admin's fixed USD price per $OKN in 8 decimals (Chainlink
// scale, $0.05 = '5000000'). Null = legacy BNB-denominated pricing (the rate
// was set directly and is not kept in sync with a USD target).
export const saleConfigSchema = z.object({
  id: z.literal(1).default(1),
  rate: z.string(),
  capPerWallet: z.string(),
  minPurchase: z.string().default('0'),
  bnbHardCap: z.string().default('0'),
  treasury: z.string().nullable().default(null), // Q-H: Safe address receiving buy() BNB
  saleStart: z.date().nullable(),
  saleEnd: z.date().nullable(),
  isPaused: z.boolean().default(false),
  priceUsd: z.string().nullable().default(null),
  // minPurchaseUsd: the admin's fixed USD minimum per purchase in 8 decimals
  // ($10 = '1000000000'). Null = legacy BNB-denominated minimum (minPurchase
  // was set directly and is not kept in sync with a USD target).
  minPurchaseUsd: z.string().nullable().default(null),
  // saleMode: app-level visibility gate for the soft-launch flow. 'draft' =
  // private test phase (public landing shows Coming Soon, only admins can
  // buy through the app); 'public' = live for everyone. DB-only — the
  // TokenSale contract has no notion of visibility; Pause remains the
  // on-chain kill switch.
  saleMode: z.enum(['draft', 'public']).default('draft'),
  updatedAt: z.date(),
});
export type SaleConfig = z.infer<typeof saleConfigSchema>;

// POST /api/admin/sale-config
// priceUsd is a HUMAN USD number ($0.05); the route converts to 8-dec and
// derives the on-chain BNB-denominated rate from the live Chainlink BNB/USD
// price. Capped at $10,000 per $OKN as a sanity bound (a typo should never
// reach setRate). When priceUsd is provided it takes precedence over `rate`.
export const saleConfigUpdateSchema = z
  .object({
    rate: z.string().optional(),
    capPerWallet: z.string().optional(),
    minPurchase: z.string().optional(),
    bnbHardCap: z.string().optional(),
    treasury: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address')
      .optional(),
    // JSON payloads carry ISO strings (JSON.stringify of a Date); coerce so a
    // sale-window save from the admin UI validates. Null clears the window.
    saleStart: z.coerce.date().nullable().optional(),
    saleEnd: z.coerce.date().nullable().optional(),
    isPaused: z.boolean().optional(),
    // saleMode: DB-only visibility flip (draft = private test phase, public =
    // live for everyone). Never produces a contract call or Safe proposal.
    saleMode: z.enum(['draft', 'public']).optional(),
    priceUsd: z
      .number()
      .positive('Price per token must be greater than zero')
      .max(10000, 'Price per token must not exceed $10000')
      .optional(),
    // minPurchaseUsd: HUMAN USD minimum per purchase ($10). The route converts
    // to 8-dec and derives the on-chain BNB-denominated minimum from the live
    // Chainlink BNB/USD price — the same pattern as priceUsd/rate. Capped at
    // $10,000 as a sanity bound (a typo should never reach setMinPurchase).
    // When provided it takes precedence over a raw `minPurchase` field.
    minPurchaseUsd: z
      .number()
      .positive('Minimum purchase must be greater than zero')
      .max(10000, 'Minimum purchase must not exceed $10000')
      .optional(),
  })
  .refine((data) => {
    if (data.saleStart && data.saleEnd && data.saleEnd <= data.saleStart) {
      return false;
    }
    return true;
  }, 'saleEnd must be after saleStart');
export type SaleConfigUpdate = z.infer<typeof saleConfigUpdateSchema>;

// POST /api/admin/claim-fee
// The claim fee is a USD value the contract stores in 8 decimals (Chainlink
// standard): $3.00 = 300000000. The input is a human USD figure; the route
// converts via Math.round(feeUsd * 1e8) before encoding setClaimFeeUsd(uint256).
// Capped at $1000 as a sanity bound (the contract has no bound, but a typo of
// $3,000,000 should not be submittable from the dashboard).
export const claimFeeUpdateSchema = z.object({
  feeUsd: z
    .number()
    .nonnegative('Fee must not be negative')
    .max(1000, 'Fee must not exceed $1000'),
});
export type ClaimFeeUpdate = z.infer<typeof claimFeeUpdateSchema>;
