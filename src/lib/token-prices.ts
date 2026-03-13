/**
 * Shared token prices (CoinGecko). Used across dashboard, balance, stake, trading, withdrawal.
 * Stablecoins default to 1; QYNX forced to 0.1.
 */

export const COINGECKO_IDS: Record<string, string> = {
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  BUSD: 'binance-usd',
  CAKE: 'pancakeswap-token',
  WBNB: 'binancecoin',
  BNB: 'binancecoin',
  WBTC: 'wrapped-bitcoin',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  WETH: 'ethereum',
  QYNX: 'qynx',
}

const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD'])

const COINGECKO_SIMPLE_PRICE = 'https://api.coingecko.com/api/v3/simple/price'

export type TokenPrices = Record<string, number>

/** Initial price cache (approximate current prices). Replaced by live data on first successful fetch. */
const INITIAL_PRICE_CACHE: TokenPrices = {
  USDT: 1, USDC: 1, DAI: 1, BUSD: 1,
  BNB: 650.53, WBNB: 650.53, ETH: 2090.19, WETH: 2090.19, WBTC: 71056, BTC: 71056, CAKE: 1.39,
  QYNX: 0.0154,
}

/** Last successful price map; when the API fails we return this so the UI shows past prices. */
let lastPrices: TokenPrices = { ...INITIAL_PRICE_CACHE }

/** Cache TTL in ms (2 min) to avoid CoinGecko 429 rate limit. */
const CACHE_TTL_MS = 2 * 60 * 1000
let cacheExpiry = 0
let fetchPromise: Promise<TokenPrices> | null = null

function buildFromApiResponse(data: Record<string, { usd?: number }>): TokenPrices {
  const result: TokenPrices = {}
  for (const [symbol, coinId] of Object.entries(COINGECKO_IDS)) {
    const raw = data?.[coinId]?.usd
    if (symbol === 'QYNX') {
      result[symbol] = 0.1
    } else if (STABLECOINS.has(symbol)) {
      result[symbol] = typeof raw === 'number' && raw > 0 ? raw : 1
    } else {
      result[symbol] = typeof raw === 'number' ? raw : 0
    }
  }
  return result
}

/** When we have no cache, return only stablecoins at 1 so we never show wrong prices for volatile assets. */
function emptyPriceMap(): TokenPrices {
  const out: TokenPrices = {}
  STABLECOINS.forEach((s) => { out[s] = 1 })
  return out
}

/** Fetch prices from CoinGecko. Cached for CACHE_TTL_MS. On 429/failure returns last successful prices. */
export async function fetchTokenPrices(): Promise<TokenPrices> {
  const now = Date.now()
  if (now < cacheExpiry && Object.keys(lastPrices).length > 0) return lastPrices
  if (fetchPromise) return fetchPromise
  const ids = Array.from(new Set(Object.values(COINGECKO_IDS))).join(',')
  const url = `${COINGECKO_SIMPLE_PRICE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd`
  fetchPromise = (async () => {
    try {
      const res = await fetch(url)
      if (res.status === 429) {
        if (Object.keys(lastPrices).length > 0) return lastPrices
        return emptyPriceMap()
      }
      const data = (await res.json()) as Record<string, { usd?: number }>
      const result = buildFromApiResponse(data)
      lastPrices = result
      cacheExpiry = Date.now() + CACHE_TTL_MS
      return result
    } catch {
      if (Object.keys(lastPrices).length > 0) return lastPrices
      return emptyPriceMap()
    } finally {
      fetchPromise = null
    }
  })()
  return fetchPromise
}

/** Get USD price for a token symbol. Normalizes symbol to uppercase. */
export function getPriceUsd(prices: TokenPrices, symbol: string): number {
  if (!symbol) return 0
  const key = symbol.toUpperCase()
  if (prices[key] !== undefined) return prices[key]
  if (STABLECOINS.has(key)) return 1
  return 0
}

/** Convert token amount to USD using price map. */
export function amountToUsd(prices: TokenPrices, amount: number, symbol: string): number {
  return (Number(amount) || 0) * getPriceUsd(prices, symbol)
}

/** Format USD for display (compact for small values). */
export function formatUsd(usd: number): string {
  if (Number.isNaN(usd) || !Number.isFinite(usd)) return '$0.00'
  if (usd >= 1_000_000) return '$' + (usd / 1_000_000).toFixed(2) + 'M'
  if (usd >= 1_000) return '$' + (usd / 1_000).toFixed(2) + 'k'
  return '$' + usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
