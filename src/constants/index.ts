// =================================
// 📌 Application Constants
// =================================

import { ChainType } from "@/types";

/**
 * Payment expiry time in minutes
 */
export const PAYMENT_EXPIRY_MINUTES = 15;

/**
 * Status polling interval in milliseconds
 */
export const STATUS_POLL_INTERVAL = 3000;

/**
 * Blockchain explorer URLs
 */
export const EXPLORER_URLS: Record<ChainType, string> = {
  ethereum: "https://etherscan.io",
  bsc: "https://bscscan.com",
  tron: "https://tronscan.org",
};

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(chain: ChainType, txHash: string): string {
  const baseUrl = EXPLORER_URLS[chain];
  if (chain === "tron") {
    return `${baseUrl}/#/transaction/${txHash}`;
  }
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(chain: ChainType, address: string): string {
  const baseUrl = EXPLORER_URLS[chain];
  if (chain === "tron") {
    return `${baseUrl}/#/address/${address}`;
  }
  return `${baseUrl}/address/${address}`;
}

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "zh";

/**
 * Payment status colors
 */
export const STATUS_COLORS = {
  pending: "yellow",
  processing: "blue",
  completed: "green",
  failed: "red",
  expired: "gray",
} as const;

