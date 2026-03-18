// =================================
// 🔗 Chain Utilities
// =================================

import { CHAIN_ID, CHAIN_EXPLORER_URLS, EXPLORER_URLS } from "@/constants";
import { ChainType, CurrencyType, NetworkType } from "@/types";

/**
 * Get ABI for specific chain
 */
export function getChainAbi(chain: ChainType) {
  switch (chain) {
    case "eth":
      return require("@/abi/ether.json");
    case "bsc":
      return require("@/abi/bsc.json");
    case "tron":
      const tronAbi = require("@/abi/tron.json");
      return tronAbi.entrys || tronAbi;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

/**
 * Get numeric chain ID
 */
export function getChainId(chain: ChainType): number {
  const chainId = CHAIN_ID[chain];
  if (!chainId) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return chainId;
}

/**
 * Format amount with proper decimals
 */
export function formatAmount(amount: string, decimals: number): string {
  return (parseInt(amount) / Math.pow(10, decimals)).toFixed(2);
}

/**
 * Validate chain type
 */
export function isValidChain(chain: string): chain is ChainType {
  return ["eth", "bsc", "tron"].includes(chain);
}

/**
 * Get wallet type from chain
 */
export function getWalletType(chain: ChainType): string {
  switch (chain) {
    case "tron":
      return "TronLink";
    case "eth":
    case "bsc":
      return "MetaMask";
    default:
      return "Unknown";
  }
}

export function getTokenDecimals(chain: ChainType, currency: CurrencyType): number {
  switch (chain) {
    case "eth":
      switch (currency) {
        case "usdt":
          return 6;
        case "usdc":
          return 6;
        default:
          return 18;
      }
    case "bsc":
      return 18;
    case "tron":
      switch (currency) {
        case "usdt":
          return 6;
        case "usdc":
          return 6;
        default:
          return 18;
      }
    default:
      return 18;
  }
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(chain: NetworkType, txHash: string): string {
  const baseUrl = EXPLORER_URLS[chain];
  if (chain === "tron") {
    return `${baseUrl}/#/transaction/${txHash}`;
  }
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(chain: NetworkType, address: string): string {
  const baseUrl = EXPLORER_URLS[chain];
  if (chain === "tron") {
    return `${baseUrl}/#/address/${address}`;
  }
  return `${baseUrl}/address/${address}`;
}

export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function isValidAddress(address: string, chain: ChainType): boolean {
  if (!address) return false;

  switch (chain) {
    case "bsc":
    case "eth":
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case "tron":
      // Use the new Tron address validation that handles both hex and base58 formats
      return Boolean(address && address.length === 34 && address.startsWith("T"));
    default:
      return false;
  }
}
