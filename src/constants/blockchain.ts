import { ChainType, CurrencyType } from "@/types";

// Network mode detection - default to testnet for now to avoid mainnet contract issues
const isMainnet = process.env.NEXT_PUBLIC_NETWORK_MODE === "mainnet";

export const CHAINS: ChainType[] = ["ethereum", "bsc", "tron"];

export const CHAIN_NAMES: Record<ChainType, string> = {
  ethereum: "Ethereum",
  bsc: "BSC",
  tron: "TRON"
};

export const CHAIN_ID: Record<ChainType, number> = {
  ethereum: isMainnet ? 1 : 11155111,
  bsc: isMainnet ? 56 : 97,
  tron: isMainnet ? 728126428 : 2494104990
};

export const CHAIN_ID_HEX: Record<ChainType, string> = {
  ethereum: isMainnet ? "0x1" : "0xaa36a7",
  bsc: isMainnet ? "0x38" : "0x61",
  tron: isMainnet ? "2B6653DC" : "94A9059E"
};

export const NATIVE_CURRENCIES: Record<ChainType, { name: string; symbol: string; decimals: number }> = {
  ethereum: { name: "Ether", symbol: "ETH", decimals: 18 },
  bsc: { name: "BNB", symbol: "BNB", decimals: 18 },
  tron: { name: "TRON", symbol: "TRX", decimals: 6 }
};

// Chain-specific maximum approval amounts for unlimited USDT spending
export const MAX_APPROVAL = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; // 2^256 - 1 (TRON uint256 max)

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "";

const MAINNET_RPC_URLS = {
  ethereum: INFURA_PROJECT_ID ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}` : "https://ethereum.publicnode.com",
  bsc: INFURA_PROJECT_ID
    ? `https://bsc-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
    : "https://bsc-dataseed1.binance.org",
  tron: "https://api.trongrid.io"
};

const TESTNET_RPC_URLS = {
  ethereum: INFURA_PROJECT_ID
    ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`
    : "https://ethereum-sepolia-public.nodies.app",
  bsc: INFURA_PROJECT_ID
    ? `https://bsc-testnet.infura.io/v3/${INFURA_PROJECT_ID}`
    : "https://data-seed-prebsc-1-s1.binance.org:8545",
  tron: "https://api.shasta.trongrid.io"
};

// RPC urls
export const RPC_URLS: Record<ChainType, string> = isMainnet ? MAINNET_RPC_URLS : TESTNET_RPC_URLS;

export const EXPLORER_URLS: Record<ChainType, string> = {
  ethereum: isMainnet ? "https://etherscan.io" : "https://sepolia.etherscan.io",
  bsc: isMainnet ? "https://bscscan.com" : "https://testnet.bscscan.com",
  tron: isMainnet ? "https://tronscan.org" : "https://shasta.tronscan.org"
};

export const TOKENS: CurrencyType[] = ["usdt", "usdc"];

export const MAINNET_TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = {
  ethereum: {
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  bsc: {
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
  },
  tron: {
    usdt: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    usdc: "TLZSucJRjnqBKwvQz6n5hd29gbS4P7u7w8"
  }
};

export const TESTNET_TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = {
  ethereum: {
    usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  },
  bsc: {
    usdt: "0x88B8319d4ac9684282990A23d857486D46d95f4B",
    usdc: "0x88B8319d4ac9684282990A23d857486D46d95f4B"
  },
  tron: {
    usdt: "TNqLH6srwCVRcbKtxFMto2jFTwPTncZJm8",
    usdc: "TNqLH6srwCVRcbKtxFMto2jFTwPTncZJm8"
  }
};

export const TOKEN_ADDRESSES: Record<ChainType, Record<CurrencyType, string>> = isMainnet
  ? MAINNET_TOKEN_ADDRESSES
  : TESTNET_TOKEN_ADDRESSES;

export const GATEWAY_ADDRESSES: Record<ChainType, string> = {
  ethereum: isMainnet ? "0xDae532f91B0A0dC2EAEc0a029d298E99E061ebeF" : "0x6a9713e133ae272a54F31de2B1df8d2adDe90E8f",
  bsc: isMainnet ? "0x889b3D7c9Eace3aE77E7B493Bbae99204E2C1b7C" : "0x91c8246Ee7CE5AC40130f19236860066C7B41f75",
  tron: isMainnet ? "417c8c831a0c4414a7d47f85c5ca3f6c101e576320" : "TWTTXmwy5gRWcuGH8e7r64AQ5F8eRcLqR6"
};
