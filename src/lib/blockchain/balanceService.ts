// =================================
// 💰 Real-time Balance Service
// =================================

import { ChainType, CurrencyType } from "@/types";
import { EVMService } from "./evmService";
import { TronService } from "./tronService";
import { TOKEN_ADDRESSES } from "@/constants/blockchain";

export interface WalletBalance {
  address: string;
  chain: ChainType;
  tokenBalance: string;
  lastUpdated: string;
}

export interface TreasuryWalletBalance {
  address: string;
  chain: ChainType;
  nativeBalance: string;
  tokenBalance: string;
  lastUpdated: string;
}

export class BalanceService {
  private static instance: BalanceService;

  private constructor() {}

  static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  /**
   * Get real-time token balance for a specific wallet on a specific chain
   */
  async getRealTimeTokenBalance(
    address: string,
    chain: ChainType,
    token: string
  ): Promise<string> {
    try {
      console.log(`Fetching ${token.toUpperCase()} balance for ${chain} wallet: ${address}`);

      if (chain === "tron") {
        // Use direct TRON API instead of TronService for more reliability
        try {
          const tokenAddress = TOKEN_ADDRESSES[chain][token as CurrencyType];
          console.log(`TRON ${token.toUpperCase()} contract address: ${tokenAddress}`);

          // First try the general tokens endpoint
          let tronResponse = await fetch(
            `https://api.trongrid.io/v1/accounts/${address}/tokens/trc20`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            }
          );

          if (tronResponse.ok) {
            const tronData = await tronResponse.json();
            console.log(
              `TRON API response for ${address}:`,
              JSON.stringify(tronData, null, 2)
            );

            if (tronData.data && tronData.data.length > 0) {
              // TRON API returns trc20 as array of objects with contract addresses as keys
              const trc20Data = tronData.data[0].trc20;
              console.log(`TRC20 data for ${address}:`, trc20Data);

              if (trc20Data && Array.isArray(trc20Data)) {
                // Find the token data
                const tokenData = trc20Data.find((tokenObj: any) => {
                  // Check if this object contains the token contract address as a key
                  return Object.keys(tokenObj).includes(tokenAddress);
                });

                if (tokenData) {
                  console.log(
                    `Found ${token.toUpperCase()} token data for ${address}:`,
                    tokenData
                  );
                  // Get the balance value using the contract address as key
                  const rawBalance = tokenData[tokenAddress];
                  console.log(
                    `Raw balance from ${token.toUpperCase()} token for ${address}:`,
                    rawBalance
                  );

                  if (rawBalance) {
                    // token has 6 decimals on TRON
                    const balance = (parseInt(rawBalance) / 1000000).toFixed(2);
                    console.log(`TRON ${token.toUpperCase()} balance for ${address}: ${balance}`);
                    return balance;
                  }
                }
              }
            }
          }

          // If we get here, no balance was found
          console.log(`No ${token.toUpperCase()} balance found for TRON address: ${address}`);
          return "0.00";
        } catch (tronError) {
          console.error(`TRON API error for ${address}:`, tronError);
          // Fallback to TronService if direct API fails
          const balance = await TronService.getUserTokenBalance(chain, token as CurrencyType, address);
          console.log(`TRON ${token.toUpperCase()} balance (fallback): ${balance}`);
          return balance;
        }
      } else {
        const balance = await EVMService.getUserTokenBalance(chain, token as CurrencyType, address);
        console.log(`${chain} ${token.toUpperCase()} balance: ${balance}`);
        return balance;
      }
    } catch (error: any) {
      console.error(
        `Error fetching ${token.toUpperCase()} balance for ${chain} wallet ${address}:`,
        error
      );
      // Silent error handling for production
      return "0.00";
    }
  }

  /**
   * Get real-time native token balance (ETH, BNB, TRX) for a specific wallet
   */
  async getRealTimeNativeBalance(
    address: string,
    chain: ChainType
  ): Promise<string> {
    try {
      console.log(`Fetching native balance for ${chain} wallet: ${address}`);

      if (chain === "tron") {
        // Use direct TRON API instead of TronService for more reliability
        try {
          const response = await fetch(
            `https://api.trongrid.io/v1/accounts/${address}`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log(
              `TRON native balance API response for ${address}:`,
              JSON.stringify(data, null, 2)
            );

            if (data.data && data.data.length > 0) {
              // TRX balance is in sun (1 TRX = 1,000,000 sun)
              const balanceInSun = data.data[0].balance || 0;
              const balanceInTRX = balanceInSun / 1000000; // Convert sun to TRX
              const balance = balanceInTRX.toFixed(6);
              console.log(`TRON native balance for ${address}: ${balance} TRX`);
              return balance;
            }
          }

          // If we get here, no balance was found
          console.log(`No native balance found for TRON address: ${address}`);
          return "0.000000";
        } catch (tronError) {
          console.error(
            `TRON native balance API error for ${address}:`,
            tronError
          );
          // Fallback to TronService if direct API fails
          const balance = await TronService.getUserNativeBalance(
            chain,
            address
          );
          console.log(`TRON native balance (fallback): ${balance}`);
          return balance;
        }
      } else {
        const balance = await EVMService.getUserNativeBalance(chain, address);
        console.log(`${chain} native balance: ${balance}`);
        return balance;
      }
    } catch (error: any) {
      console.error(
        `Error fetching native balance for ${chain} wallet ${address}:`,
        error
      );
      // Silent error handling for production
      return "0.000000";
    }
  }

  /**
   * Get real-time balances for treasury wallets (both native and token)
   */
  async getTreasuryWalletBalances(
    wallets: Array<{ address: string; chain: ChainType }>,
    token: string
  ): Promise<TreasuryWalletBalance[]> {
    console.log(`\n=== TREASURY WALLET BALANCES ===`);
    console.log(`Fetching balances for ${wallets.length} treasury wallets...`);

    const balancePromises = wallets.map(async (wallet) => {
      try {
        console.log(
          `\n--- Fetching balances for ${wallet.chain} wallet: ${wallet.address} ---`
        );

        const [nativeBalance, tokenBalance] = await Promise.all([
          this.getRealTimeNativeBalance(wallet.address, wallet.chain),
          this.getRealTimeTokenBalance(wallet.address, wallet.chain, token),
        ]);

        console.log(
          `✅ ${wallet.chain} wallet balances - Native: ${nativeBalance}, ${token.toUpperCase()}: ${tokenBalance}`
        );

        return {
          address: wallet.address,
          chain: wallet.chain,
          nativeBalance,
          tokenBalance,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error(
          `❌ Error fetching balances for ${wallet.chain} wallet ${wallet.address}:`,
          error
        );
        // Return default values if balance fetching fails
        return {
          address: wallet.address,
          chain: wallet.chain,
          nativeBalance: "0.000000",
          tokenBalance: "0.00",
          lastUpdated: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.all(balancePromises);
    console.log(
      `\n✅ Successfully fetched balances for ${results.length} treasury wallets`
    );
    console.log(`=== END TREASURY WALLET BALANCES ===\n`);
    return results;
  }

  /**
   * Get real-time token balances for multiple wallets
   * Only checks the specific chain where each wallet was approved
   */
  async getRealTimeTokenBalances(
    wallets: Array<{ address: string; chain: ChainType }>,
    token: string
  ): Promise<WalletBalance[]> {
    const balancePromises = wallets.map(async (wallet) => {
      // Only check balance on the specific chain where wallet was approved
      const tokenBalance = await this.getRealTimeTokenBalance(
        wallet.address,
        wallet.chain,
        token
      );

      return {
        address: wallet.address,
        chain: wallet.chain,
        tokenBalance,
        lastUpdated: new Date().toISOString(),
      };
    });

    return Promise.all(balancePromises);
  }

  /**
   * Get real-time token balance for a wallet on a specific chain only
   * This is more efficient than checking all chains
   */
  async getWalletBalanceOnSpecificChain(
    address: string,
    chain: ChainType,
    token: string
  ): Promise<string> {
    return await this.getRealTimeTokenBalance(address, chain, token);
  }

  /**
   * Get real-time balances for a single user address (both native and token)
   */
  async getUserBalances(
    chain: ChainType,
    address: string,
    token: string
  ): Promise<{ nativeBalance: string; tokenBalance: string }> {
    try {
      console.log(`Fetching balances for ${chain} user: ${address}`);

      const [nativeBalance, tokenBalance] = await Promise.all([
        this.getRealTimeNativeBalance(address, chain),
        this.getRealTimeTokenBalance(address, chain, token),
      ]);

      console.log(
        `${chain} user balances - Native: ${nativeBalance}, ${token.toUpperCase()}: ${tokenBalance}`
      );

      return {
        nativeBalance,
        tokenBalance,
      };
    } catch (error) {
      console.error(
        `Error fetching balances for ${chain} user ${address}:`,
        error
      );
      // Return default values if balance fetching fails
      return {
        nativeBalance: "0.000000",
        tokenBalance: "0.00",
      };
    }
  }
}

export const balanceService = BalanceService.getInstance();
