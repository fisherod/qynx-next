"use client";

import { useState, useEffect, useMemo } from "react";

// CoinGecko global coin IDs – protocol-supported tokens (BSC + Ethereum)
const COINGECKO_IDS: Record<string, string> = {
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  WBNB: "binancecoin",
  BNB: "binancecoin",
  WBTC: "wrapped-bitcoin",
  ETH: "ethereum",
  WETH: "ethereum",
  QYNX: "qynx"
};

const TICKER_ORDER = ["USDT", "USDC", "DAI", "WBNB", "BNB", "WBTC", "ETH", "WETH", "QYNX"] as const;

const TOKEN_IMAGES: Record<string, string> = {
  BNB: "/coins/bnb.svg",
  USDT: "/coins/usdt.svg",
  USDC: "/coins/usdc.svg",
  DAI: "/coins/dai.svg",
  WBTC: "/coins/wbtc.svg",
  WBNB: "/coins/wbnb.svg",
  ETH: "/coins/eth.svg",
  WETH: "/coins/weth.svg",
  QYNX: "/qynx.png"
};

export interface TickerItem {
  symbol: string;
  priceUsd: number;
  change24h: number | null;
  icon?: string;
}

const COINGECKO_SIMPLE_PRICE = "https://api.coingecko.com/api/v3/simple/price";

/** Cache TTL (2 min) to avoid CoinGecko 429. */
const TICKER_CACHE_TTL_MS = 2 * 60 * 1000;
let tickerCache: { items: TickerItem[]; expiry: number } | null = null;
let tickerFetchPromise: Promise<TickerItem[]> | null = null;

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (price >= 0.01) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (price > 0) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return "0.00";
}

function formatChange(change: number | null): string {
  if (change === null || change === undefined) return "—";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/** Last successful ticker items; used when the API fails so the ticker keeps showing past prices. */
let lastTickerItems: TickerItem[] = [];

export default function BscPriceTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    function doFetch(): Promise<TickerItem[]> {
      const now = Date.now();
      if (tickerCache && now < tickerCache.expiry) return Promise.resolve(tickerCache.items);
      if (tickerFetchPromise) return tickerFetchPromise;
      const ids = Array.from(new Set(Object.values(COINGECKO_IDS))).join(",");
      const url = `${COINGECKO_SIMPLE_PRICE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;
      tickerFetchPromise = fetch(url)
        .then(async r => {
          if (r.status === 429) return { rateLimited: true } as const;
          const data = (await r.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
          return { rateLimited: false, data };
        })
        .then(x => {
          if (x.rateLimited) return lastTickerItems;
          const data = x.data;
          const result: TickerItem[] = [];
          for (const symbol of TICKER_ORDER) {
            const coinId = COINGECKO_IDS[symbol];
            const raw = coinId ? data?.[coinId] : null;
            result.push({
              symbol,
              priceUsd: symbol === "QYNX" ? (raw?.usd ?? 0.0154) : (raw?.usd ?? 0),
              change24h: raw?.usd_24h_change ?? null,
              icon: TOKEN_IMAGES[symbol]
            });
          }
          lastTickerItems = result;
          tickerCache = { items: result, expiry: Date.now() + TICKER_CACHE_TTL_MS };
          return result;
        })
        .finally(() => {
          tickerFetchPromise = null;
        });
      return tickerFetchPromise;
    }

    doFetch()
      .then(result => {
        if (!cancelled) setItems(result);
      })
      .catch(e => {
        if (cancelled) return;
        if (lastTickerItems.length > 0) setItems(lastTickerItems);
        else setError(e instanceof Error ? e.message : "Failed to load prices");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const row = useMemo(() => (items.length > 0 ? items : null), [items]);

  const fixedClasses = "fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a12]/95 backdrop-blur-sm";

  if (error) {
    return (
      <div className={`${fixedClasses} py-2 px-4`}>
        <p className="text-center text-[#C8C8C8] text-sm">BSC prices temporarily unavailable</p>
      </div>
    );
  }

  if (loading || !row) {
    return (
      <div className={`${fixedClasses} py-3 px-4`}>
        <div className="flex justify-center gap-6 flex-wrap">
          {TICKER_ORDER.map(s => (
            <div key={s} className="flex items-center gap-2 text-[#C8C8C8] text-sm">
              <span className="font-semibold text-white">{s}</span>
              <span className="animate-pulse">$—</span>
              <span className="text-white/50">—%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${fixedClasses} overflow-hidden py-2.5 z-200`}>
      <div className="marquee-bsc flex">
        <div className="flex items-center gap-8 shrink-0 pr-8">
          {row.map(item => (
            <div key={item.symbol} className="flex items-center gap-2 shrink-0">
              {item.icon && <img src={item.icon} alt="" className="w-6 h-6 rounded-full object-cover" />}
              <span className="text-white font-semibold text-sm">{item.symbol}</span>
              <span className="text-[#E4B5FF] font-medium text-sm">${formatPrice(item.priceUsd)}</span>
              <span
                className={`text-xs font-medium ${
                  item.change24h === null ? "text-[#C8C8C8]" : item.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatChange(item.change24h)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-8 shrink-0 pr-8" aria-hidden>
          {row.map(item => (
            <div key={`dup-${item.symbol}`} className="flex items-center gap-2 shrink-0">
              {item.icon && <img src={item.icon} alt="" className="w-6 h-6 rounded-full object-cover" />}
              <span className="text-white font-semibold text-sm">{item.symbol}</span>
              <span className="text-[#E4B5FF] font-medium text-sm">${formatPrice(item.priceUsd)}</span>
              <span
                className={`text-xs font-medium ${
                  item.change24h === null ? "text-[#C8C8C8]" : item.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatChange(item.change24h)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
