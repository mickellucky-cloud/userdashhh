/**
 * @okn/shared — shared schemas, types, ABIs, constants.
 *
 * Single source of truth for the bot and web apps.
 * Relative imports stay EXTENSIONLESS: Next.js transpiles this source via
 * transpilePackages, and webpack (with "type": "module") requires specifiers
 * to match files on disk — './schemas/index.js' does not exist in src and
 * fails the build. Node ESM consumers (apps/verifier) get their extensions
 * from the compiled dist: scripts/fix-esm-extensions.mjs runs after tsc and
 * rewrites every relative specifier in dist to an explicit .js path.
 *
 * NOTE: crypto utils (validateInitData, validateTelegramLogin) are NOT re-exported
 * here because they use node:crypto which breaks browser bundles. Import them
 * directly from '@okn/shared/crypto' in server-side code only.
 */
export * from './schemas/index';
export * from './types/index';
export * from './constants/index';
export { oknTokenAbi, merkleDistributorAbi, tokenSaleAbi, teamVestingAbi, ABIS } from './abis/index';
