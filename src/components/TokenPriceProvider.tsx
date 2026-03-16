"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  fetchTokenPrices,
  getPriceUsd as getPriceUsdLib,
  amountToUsd as amountToUsdLib,
  type TokenPrices
} from "@/lib/token-prices";

interface TokenPriceContextValue {
  prices: TokenPrices;
  loading: boolean;
  getPriceUsd: (symbol: string) => number;
  amountToUsd: (amount: number, symbol: string) => number;
}

const TokenPriceContext = createContext<TokenPriceContextValue | null>(null);

function TokenPriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTokenPrices()
      .then(data => {
        if (!cancelled) setPrices(data);
      })
      .catch(() => {
        if (!cancelled) {
          // Keep previous prices; fetchTokenPrices already returns cache/fallback on API failure
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getPriceUsd = useCallback((symbol: string) => getPriceUsdLib(prices, symbol), [prices]);
  const amountToUsd = useCallback((amount: number, symbol: string) => amountToUsdLib(prices, amount, symbol), [prices]);

  const value: TokenPriceContextValue = { prices, loading, getPriceUsd, amountToUsd };

  return <TokenPriceContext.Provider value={value}>{children}</TokenPriceContext.Provider>;
}

export default TokenPriceProvider;
export function useTokenPrices(): TokenPriceContextValue {
  const ctx = useContext(TokenPriceContext);
  if (!ctx) {
    return {
      prices: {},
      loading: true,
      getPriceUsd: () => 0,
      amountToUsd: () => 0
    };
  }
  return ctx;
}
