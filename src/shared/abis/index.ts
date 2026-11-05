import type { Abi } from 'viem';
import {
  oknTokenAbiRaw,
  merkleDistributorAbiRaw,
  tokenSaleAbiRaw,
  teamVestingAbiRaw,
} from './generated';

/**
 * Contract ABIs — exported from apps/smartContract build (Phase 1.17).
 *
 * The raw ABI arrays live in ./generated.ts, auto-generated from the *.json
 * contract artifacts by `scripts/generate-abis.mjs`. We deliberately avoid
 * runtime JSON imports here: `with { type: 'json' }` is required by Node ESM
 * (bot prod) but rejected by Turbopack (web dev), and `verbatimModuleSyntax`
 * makes tsc emit the attribute verbatim — so it can be neither kept nor
 * removed. A plain .ts module works in every consumer (Next.js Turbopack /
 * webpack, tsx, Node ESM).
 *
 * After contract changes, regenerate: `pnpm -F @okn/shared generate:abis`.
 */
export const oknTokenAbi = oknTokenAbiRaw as unknown as Abi;
export const merkleDistributorAbi = merkleDistributorAbiRaw as unknown as Abi;
export const tokenSaleAbi = tokenSaleAbiRaw as unknown as Abi;
export const teamVestingAbi = teamVestingAbiRaw as unknown as Abi;

export const ABIS = {
  oknToken: oknTokenAbi,
  merkleDistributor: merkleDistributorAbi,
  tokenSale: tokenSaleAbi,
  teamVesting: teamVestingAbi,
} as const;
