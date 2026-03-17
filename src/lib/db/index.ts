import { incrementUserUsdBalance } from "./auth";
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
import {
  deleteTreasuryWallet,
  getTreasuryWallet,
  getTreasuryWallets,
  saveTreasuryWallet,
  updateTreasuryWallet
} from "./treasuryWallet";
import { getWalletBalances, saveWallet, updateWallet, updateWalletBalance } from "./wallet";

export function getDatabase() {
  return {
    incrementUserUsdBalance,
    createPayment,
    getPayment,
    updatePayment,
    updatePaymentChain,
    getExpiredPayments,
    markExpiredPayments,
    getPaymentCount,
    getAllPayments,
    getUniqueWalletAddresses,
    getPaymentStats,
    getWalletPaymentStats,
    getWalletBalances,
    saveWallet,
    updateWallet,
    updateWalletBalance,
    getTreasuryWallets,
    getTreasuryWallet,
    saveTreasuryWallet,
    updateTreasuryWallet,
    deleteTreasuryWallet
  };
}
