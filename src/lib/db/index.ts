import { getAutoTransferHistory, recordTransfer } from "./autoTransfer";
import { getAutoTransferConfig, updateAutoTransferConfig } from "./autoTransferConfig";
import {
  createPayment,
  getAllPayments,
  getExpiredPayments,
  getPayment,
  getPaymentCount,
  getPaymentStats,
  getUniqueWalletAddresses,
  getWalletPaymentStats,
  markExpiredPayments,
  updatePayment,
  updatePaymentChain
} from "./payment";
import { getPaymentEvents, logEvent } from "./paymentEvent";
import {
  deleteTreasuryWallet,
  getTreasuryWallet,
  getTreasuryWallets,
  saveTreasuryWallet,
  updateTreasuryWallet
} from "./treasuryWallet";
import { getWalletBalances, saveWallet, updateWallet, updateWalletBalance } from "./wallet";
import { getWebhookLogs, logWebhook } from "./webhookLog";

export function getDatabase() {
  return {
    createPayment,
    getPayment,
    updatePayment,
    updatePaymentChain,
    getExpiredPayments,
    markExpiredPayments,
    logEvent,
    getPaymentEvents,
    logWebhook,
    getWebhookLogs,
    getPaymentCount,
    getAllPayments,
    getUniqueWalletAddresses,
    getPaymentStats,
    getWalletPaymentStats,
    getWalletBalances,
    saveWallet,
    updateWallet,
    updateWalletBalance,
    recordTransfer,
    getAutoTransferConfig,
    updateAutoTransferConfig,
    getAutoTransferHistory,
    getTreasuryWallets,
    getTreasuryWallet,
    saveTreasuryWallet,
    updateTreasuryWallet,
    deleteTreasuryWallet
  };
}
