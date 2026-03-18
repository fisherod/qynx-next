export const BTC_SATS_PER_BTC = 100000000;
export const BITCOIN_IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK_MODE === "mainnet";
export const BITCOIN_NETWORK = BITCOIN_IS_MAINNET ? "mainnet" : "testnet";
export const BITCOIN_MEMPOOL_BASE_URL = BITCOIN_IS_MAINNET ? "https://mempool.space" : "https://mempool.space/testnet";

export function getBitcoinExplorerBaseUrl(): string {
  return BITCOIN_MEMPOOL_BASE_URL;
}

export function getBitcoinAddressExplorerUrl(address: string): string {
  return `${BITCOIN_MEMPOOL_BASE_URL}/address/${address}`;
}

export function getBitcoinTxExplorerUrl(txHash: string): string {
  return `${BITCOIN_MEMPOOL_BASE_URL}/tx/${txHash}`;
}

export function btcToSats(amount: number | string): number {
  const raw = typeof amount === "number" ? amount.toString() : String(amount).trim();
  if (!raw) return 0;

  const [wholePart, fractionPart = ""] = raw.split(".");
  const whole = BigInt(wholePart || "0");
  const fraction = BigInt((fractionPart + "00000000").slice(0, 8) || "0");
  return Number(whole * BigInt(BTC_SATS_PER_BTC) + fraction);
}

export function satsToBtc(sats: number): string {
  if (!Number.isFinite(sats) || sats <= 0) return "0";
  return (sats / BTC_SATS_PER_BTC).toFixed(8).replace(/\.?0+$/, "") || "0";
}

async function fetchBitcoinJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30 } as any
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Bitcoin data: ${response.status}`);
  }

  return response.json();
}

export async function getBitcoinAddressBalanceSats(address: string): Promise<number> {
  if (!address) {
    throw new Error("Bitcoin address is required");
  }

  const data = await fetchBitcoinJson(`${BITCOIN_MEMPOOL_BASE_URL}/api/address/${address}`);
  const chainBalance = Number(data?.chain_stats?.funded_txo_sum || 0) - Number(data?.chain_stats?.spent_txo_sum || 0);
  const mempoolBalance =
    Number(data?.mempool_stats?.funded_txo_sum || 0) - Number(data?.mempool_stats?.spent_txo_sum || 0);

  const total = chainBalance + mempoolBalance;
  return Number.isFinite(total) && total >= 0 ? total : 0;
}

export async function getBitcoinTxOutputSats(txHash: string, address: string): Promise<number> {
  if (!txHash) {
    throw new Error("Bitcoin transaction hash is required");
  }
  if (!address) {
    throw new Error("Bitcoin address is required");
  }

  const data = await fetchBitcoinJson(`${BITCOIN_MEMPOOL_BASE_URL}/api/tx/${txHash}`);
  const outputs = Array.isArray(data?.vout) ? data.vout : [];

  return outputs.reduce((total: number, output: any) => {
    if (output?.scriptpubkey_address === address) {
      return total + Number(output?.value || 0);
    }
    return total;
  }, 0);
}
