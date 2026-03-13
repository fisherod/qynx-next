// Token symbol -> image path in public folder
export const TOKEN_IMAGES: Record<string, string> = {
  BTC: '/btc.png',
  BNB: '/bnb.png',
  USDT: '/usdt.png',
  USDC: '/usdc.png',
  TRX: '/tron.png',
  CAKE: '/cake.webp',
  DAI: '/dai.png',
  WBTC: '/wbtc.png',
  WBNB: '/wbnb.png',
  QYNX: '/qynx.png',
  ETH: '/eth.png',
  WETH: '/weth.png',
}

export type NetworkKey = 'ethereum' | 'bsc' | 'bitcoin'

// Network -> image path in public folder
export const NETWORK_IMAGES: Record<NetworkKey, string> = {
  ethereum: '/eth_network.png',
  bsc: '/bsc-network.png',
  bitcoin: '/bitcoin_network.png',
}
