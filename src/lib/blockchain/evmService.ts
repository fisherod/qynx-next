// =================================
// 🔗 EVM Blockchain Service (Ethereum, BSC)
// =================================

import { GATEWAY_ADDRESSES, RPC_URLS, TOKEN_ADDRESSES } from "@/constants";
import { BlockchainResult, ChainType, CurrencyType } from "@/types";
import GatewayAbi from "@/abi/Gateway.json";

// Import ethers for blockchain operations
let ethers: any;

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Lazy load ethers to avoid SSR issues
async function getEthers() {
  if (!ethers) {
    ethers = await import("ethers");
  }
  return ethers;
}

export class EVMService {
  /**
   * Get user's token balance
   */
  static async getUserTokenBalance(chain: ChainType, currency: CurrencyType, address: string): Promise<string> {
    try {
      const { ethers } = await getEthers();
      const rpcUrl = RPC_URLS[chain];

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESSES[chain][currency],
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );

      const balance = await tokenContract.balanceOf(address);
      console.log(`✅ ${currency.toUpperCase()} balance for ${address} on ${chain.toUpperCase()}:`, balance.toString());
      return balance.toString(); // Return raw uint256 string
    } catch (error: any) {
      console.error(
        `❌ Error getting ${currency.toUpperCase()} balance for ${address} on ${chain.toUpperCase()}:`,
        error
      );
      return "0";
    }
  }

  /**
   * Get user's native token balance (ETH, BNB)
   */
  static async getUserNativeBalance(chain: ChainType, address: string): Promise<string> {
    try {
      const { ethers } = await getEthers();
      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);

      const balance = await provider.getBalance(address);
      return balance.toString();
    } catch (error: any) {
      // Silent error handling for production
      return "0";
    }
  }

  static async getTokenDecimals(chain: ChainType, currency: CurrencyType): Promise<number> {
    try {
      const { ethers } = await getEthers();
      const rpcUrl = RPC_URLS[chain];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenAddress = TOKEN_ADDRESSES[chain][currency];
      const decimals = await provider.call({
        to: tokenAddress,
        data: ethers.id("decimals()").substring(0, 10)
      });
      return parseInt(decimals.toString(), 16);
    } catch (error: any) {
      console.error(`❌ Error getting ${currency.toUpperCase()} decimals for ${chain.toUpperCase()}:`, error);
      return 18;
    }
  }

  /**
   * Check if user needs to approve token spending
   */
  static async needsApproval(
    chain: ChainType,
    currency: CurrencyType,
    userAddress: string,
    amount: string
  ): Promise<{
    needsApproval: boolean;
    currentAllowance: string;
    error?: string;
  }> {
    try {
      const { ethers } = await getEthers();
      const rpcUrl = RPC_URLS[chain];
      const tokenAddress = TOKEN_ADDRESSES[chain][currency];
      const gatewayAddress = GATEWAY_ADDRESSES[chain];

      // Validate addresses
      if (!gatewayAddress || !ethers.isAddress(gatewayAddress)) {
        throw new Error(`Invalid payment processor address for ${chain}: ${gatewayAddress}`);
      }

      if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid ${currency.toUpperCase()} address for ${chain}: ${tokenAddress}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Check current allowance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function allowance(address owner, address spender) view returns (uint256)"],
        provider
      );

      const currentAllowance = await tokenContract.allowance(userAddress, gatewayAddress);

      const decimals = await this.getTokenDecimals(chain, currency);
      const requiredAmount = ethers.parseUnits(amount, decimals);

      return {
        needsApproval: currentAllowance < requiredAmount,
        currentAllowance: currentAllowance.toString()
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        needsApproval: true, // Default to requiring approval on error
        currentAllowance: "0",
        error: error.message || "Failed to check approval status"
      };
    }
  }

  /**
   * Transfer token from approved user using gateway contract
   */
  static async transferFromUser(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<BlockchainResult> {
    try {
      const { ethers } = await getEthers();
      const gatewayAddress = GATEWAY_ADDRESSES[chain];

      if (!gatewayAddress) {
        return {
          success: false,
          error: "Gateway contract address not configured"
        };
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const operatorPrivateKey = process.env.NEXT_PUBLIC_EVM_OPERATOR_PRIVATE_KEY;

      if (!operatorPrivateKey) {
        return {
          success: false,
          error: "EVM private key not configured"
        };
      }

      const operatorWallet = new ethers.Wallet(operatorPrivateKey, provider);
      const gatewayContract = new ethers.Contract(gatewayAddress, GatewayAbi, operatorWallet);

      // Convert amount to proper format based on chain
      const decimals = await this.getTokenDecimals(chain, currency);
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Execute transferFrom transaction through gateway contract
      const tx = await gatewayContract.transferFrom(
        TOKEN_ADDRESSES[chain][currency],
        fromAddress,
        toAddress,
        amountInWei
      );

      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        message: `${amount} ${currency.toUpperCase()} transferred from ${fromAddress} to ${toAddress} (via gateway contract)`
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        success: false,
        error: error.message || `Failed to transfer ${currency.toUpperCase()} via gateway contract`
      };
    }
  }

  /**
   * Get user's approved token allowance
   */
  static async getUserAllowance(chain: ChainType, userAddress: string): Promise<string> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const contract = new ethers.Contract(GATEWAY_ADDRESSES[chain], GatewayAbi, provider);

      const allowance = await contract.getUserAllowance(userAddress);
      return allowance.toString();
    } catch (error) {
      // Silent error handling for production
      return "0";
    }
  }

  /**
   * Get all approved users
   */
  static async getAllApprovedUsers(chain: ChainType): Promise<string[]> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const contract = new ethers.Contract(GATEWAY_ADDRESSES[chain], GatewayAbi, provider);

      const users = await contract.getAllApprovedUsers();
      return users;
    } catch (error) {
      // Silent error handling for production
      return [];
    }
  }

  /**
   * Revoke user approval
   */
  static async revokeUserApproval(chain: ChainType, userAddress: string): Promise<BlockchainResult> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const serverPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!serverPrivateKey) {
        return {
          success: false,
          error: "EVM private key not configured"
        };
      }

      const serverWallet = new ethers.Wallet(serverPrivateKey, provider);
      const contract = new ethers.Contract(GATEWAY_ADDRESSES[chain], GatewayAbi, serverWallet);

      const tx = await contract.revokeUserApproval(userAddress);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      // Silent error handling for production
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer token from approved user using owner's private key
   */
  static async transferFromUserAsOwner(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<BlockchainResult> {
    try {
      const { ethers } = await getEthers();

      // Validate addresses
      if (!ethers.isAddress(fromAddress)) {
        throw new Error(`Invalid from address: ${fromAddress}`);
      }

      if (!ethers.isAddress(toAddress)) {
        throw new Error(`Invalid to address: ${toAddress}`);
      }

      // Get owner's private key from environment
      const ownerPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
      if (!ownerPrivateKey) {
        throw new Error("Owner private key not configured");
      }

      // Create owner wallet
      const ownerWallet = new ethers.Wallet(ownerPrivateKey);

      // Create provider and connect wallet
      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const connectedWallet = ownerWallet.connect(provider);

      // Create token contract instance
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESSES[chain][currency],
        [
          "function transferFrom(address from, address to, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)"
        ],
        connectedWallet
      );

      // Check if owner has sufficient allowance
      const allowance = await tokenContract.allowance(fromAddress, ownerWallet.address);
      const requiredAmount = BigInt(amount);

      if (BigInt(allowance) < requiredAmount) {
        throw new Error(`Insufficient allowance. Required: ${amount}, Available: ${allowance}`);
      }

      // Execute transferFrom transaction
      const tx = await tokenContract.transferFrom(fromAddress, toAddress, requiredAmount);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        message: "Transfer completed successfully"
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        success: false,
        error: error.message || "Transfer failed"
      };
    }
  }
}
