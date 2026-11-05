/**
 * lib/safe/decode-calldata.ts
 *
 * Decodes raw Safe transaction calldata into human-readable descriptions for
 * the admin UI. Takes hex calldata + contract name, returns a friendly
 * summary like "Set sale rate to 1,000,000 OKN/BNB".
 *
 * Used by the transaction panel so admins see what they're approving BEFORE
 * they sign — not opaque hex.
 */
import { decodeFunctionData, formatEther, type Hex } from 'viem';
import { tokenSaleAbi, merkleDistributorAbi, oknTokenAbi } from '@okn/shared';

export type ContractName = 'tokenSale' | 'merkleDistributor' | 'oknToken' | 'unknown';

const ABI_MAP: Record<ContractName, typeof tokenSaleAbi> = {
  tokenSale: tokenSaleAbi,
  merkleDistributor: merkleDistributorAbi,
  oknToken: oknTokenAbi,
  unknown: [],
};

export interface DecodedCalldata {
  functionName: string;
  args: Record<string, unknown>;
  description: string;
}

/** Resolve the contract name from a target address (best-effort). */
export function contractNameFromAddress(address: string): ContractName {
  const lower = address.toLowerCase();
  const tokenSale = process.env.NEXT_PUBLIC_TOKEN_SALE_ADDRESS?.toLowerCase();
  const distributor = process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS?.toLowerCase();
  const token = process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS?.toLowerCase();
  if (tokenSale && lower === tokenSale) return 'tokenSale';
  if (distributor && lower === distributor) return 'merkleDistributor';
  if (token && lower === token) return 'oknToken';
  return 'unknown';
}

export function decodeCalldata(
  calldata: string,
  contractName: ContractName = 'unknown',
): DecodedCalldata {
  if (!calldata || !calldata.startsWith('0x') || calldata.length < 10) {
    return { functionName: 'unknown', args: {}, description: 'Unknown (no calldata)' };
  }

  const abi = ABI_MAP[contractName] ?? [];
  if (abi.length === 0) {
    return { functionName: 'unknown', args: {}, description: 'Unknown (contract not recognized)' };
  }

  try {
    const decoded = decodeFunctionData({
      abi,
      data: calldata as Hex,
    });

    const functionName = decoded.functionName;
    const argsArray = (decoded.args ?? []) as unknown[];
    return {
      functionName,
      args: argsToRecord(functionName, argsArray, contractName),
      description: describeCall(functionName, argsArray, contractName),
    };
  } catch {
    return { functionName: 'unknown', args: {}, description: 'Unknown (could not decode)' };
  }
}

/** Map positional args to a named record based on known function signatures. */
function argsToRecord(
  functionName: string,
  args: unknown[],
  contractName: ContractName,
): Record<string, unknown> {
  const paramNames = PARAM_NAMES[`${contractName}.${functionName}`] ?? [];
  const record: Record<string, unknown> = {};
  args.forEach((arg, i) => {
    const name = paramNames[i] ?? `arg${i}`;
    record[name] = formatValue(arg, name);
  });
  return record;
}

/** Generate a human-readable description of the transaction. */
function describeCall(
  functionName: string,
  args: unknown[],
  contractName: ContractName,
): string {
  switch (`${contractName}.${functionName}`) {
    case 'tokenSale.setRate': {
      const rate = args[0] as bigint;
      return `Set sale rate to ${(Number(rate) / 1e24).toLocaleString()} OKN/BNB`;
    }
    case 'tokenSale.setCapPerWallet': {
      const cap = args[0] as bigint;
      return `Set per-wallet cap to ${formatEther(cap)} BNB`;
    }
    case 'tokenSale.withdraw': {
      const to = args[0] as string;
      const amount = args[1] as bigint;
      return `Withdraw ${formatEther(amount)} BNB to ${shortAddr(to)}`;
    }
    case 'tokenSale.setPaused': {
      const paused = args[0] as boolean;
      return paused ? 'Pause the token sale' : 'Unpause the token sale';
    }
    case 'merkleDistributor.setMerkleRoot': {
      return `Update the Merkle root (enables new claims)`;
    }
    case 'merkleDistributor.withdrawFees': {
      return `Withdraw accumulated claim fees to treasury`;
    }
    case 'merkleDistributor.pause': {
      return 'Pause the claim distributor (emergency stop)';
    }
    case 'merkleDistributor.unpause': {
      return 'Unpause the claim distributor';
    }
    case 'merkleDistributor.setClaimFeeUsd': {
      const fee = args[0] as bigint;
      return `Set claim fee to $${(Number(fee) / 1e8).toFixed(2)} USD`;
    }
    default:
      return `Call ${functionName}() on ${contractName}`;
  }
}

/** Known parameter names for readability. */
const PARAM_NAMES: Record<string, string[]> = {
  'tokenSale.setRate': ['newRate'],
  'tokenSale.setCapPerWallet': ['newCap'],
  'tokenSale.setMinPurchase': ['newMin'],
  'tokenSale.withdraw': ['to', 'amount'],
  'tokenSale.setPaused': ['paused'],
  'merkleDistributor.setMerkleRoot': ['newRoot'],
  'merkleDistributor.withdrawFees': [],
  'merkleDistributor.pause': [],
  'merkleDistributor.unpause': [],
  'merkleDistributor.setClaimFeeUsd': ['_feeUsd'],
};

/** Format a value for display. */
function formatValue(value: unknown, name: string): string {
  if (typeof value === 'bigint') {
    if (name.toLowerCase().includes('rate')) return (Number(value) / 1e24).toLocaleString();
    // _feeUsd is a USD value in 8 decimals (Chainlink standard).
    if (name.toLowerCase().includes('feeusd')) return `$${(Number(value) / 1e8).toFixed(2)}`;
    return formatEther(value);
  }
  if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
    return shortAddr(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
