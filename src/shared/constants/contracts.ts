import { CONTRACTS } from './chains';

// Contract addresses per network. After deploy, these are populated from env.
// Single source of truth — both web (wagmi) and bot read from here.
export const CONTRACT_ADDRESSES = {
  oknToken: CONTRACTS.oknToken,
  merkleDistributor: CONTRACTS.merkleDistributor,
  tokenSale: CONTRACTS.tokenSale,
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES;
