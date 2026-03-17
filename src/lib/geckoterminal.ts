import { MAINNET_TOKEN_ADDRESSES } from "@/constants";
import { ChainType, CurrencyType } from "@/types";

// Map internal chains to GeckoTerminal network IDs
const GECKO_NETWORK: Record<ChainType, string> = {
  eth: "eth",
  bsc: "bsc",
  tron: "tron" // placeholder; adjust if you use GeckoTerminal on Tron
};

export async function getUsdPriceFromGeckoTerminal(chain: ChainType, currency: CurrencyType): Promise<number> {
  const network = GECKO_NETWORK[chain];
  const tokenAddress = MAINNET_TOKEN_ADDRESSES[chain]?.[currency];
  if (!network || !tokenAddress) return 1;

  try {
    // GeckoTerminal public price API; adjust path/params to your actual usage
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${tokenAddress}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      // cache for a short time
      next: { revalidate: 60 } as any
    });

    if (!res.ok) return 1;
    const data = (await res.json()) as any;
    const price = Number(data.data?.attributes?.token_prices?.[tokenAddress]);
    return !Number.isNaN(price) && price > 0 ? price : 1;
  } catch (error) {
    console.error("Error fetching GeckoTerminal price:", error);
    return 1;
  }
}
