// =================================
// ✅ Validation Utilities
// =================================

import { ChainType } from "@/types";

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate TRON address format
 */
export function isValidTronAddress(address: string): boolean {
  return /^T[A-Za-z1-9]{33}$/.test(address);
}

/**
 * Validate address for specific chain
 */
export function isValidAddress(address: string, chain: ChainType): boolean {
  if (chain === "tron") {
    return isValidTronAddress(address);
  }
  return isValidEthereumAddress(address);
}

/**
 * Validate payment amount
 */
export function isValidAmount(amount: number | string): boolean {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
