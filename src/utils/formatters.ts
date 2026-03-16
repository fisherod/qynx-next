// =================================
// 📝 Formatting Utilities
// =================================

/**
 * Format payment amount - removes trailing zeros
 */
export function formatPaymentAmount(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00";
  const formatted = numAmount.toFixed(2);
  return formatted.replace(/\.?0+$/, "") || "0";
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number | string, symbol: string = "USDT", decimals: number = 2): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `0.00 ${symbol}`;
  return `${numAmount.toFixed(decimals)} ${symbol}`;
}

/**
 * Format address - truncate with ellipsis
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}
