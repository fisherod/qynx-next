// =================================
// 📌 Application Constants
// =================================

import { ChainType, CurrencyType } from "@/types";

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
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

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

export const MAINNET_TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = {
  ethereum: {
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  bsc: {
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  tron: {
    usdt: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    usdc: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
};

export const TESTNET_TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = {
  ethereum: {
    usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  bsc: {
    usdt: "0x88B8319d4ac9684282990A23d857486D46d95f4B",
    usdc: "0x88B8319d4ac9684282990A23d857486D46d95f4B",
  },
  tron: {
    usdt: "TNqLH6srwCVRcbKtxFMto2jFTwPTncZJm8",
    usdc: "TNqLH6srwCVRcbKtxFMto2jFTwPTncZJm8",
  },
};

export const TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = process.env.NEXT_PUBLIC_NETWORK_MODE === "mainnet" ? MAINNET_TOKEN_ADDRESSES : TESTNET_TOKEN_ADDRESSES;
