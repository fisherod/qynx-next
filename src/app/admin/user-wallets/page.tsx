"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface Wallet {
  address: string;
  chain: string;
  currency: string;
  investedAmount: string;
  status: string;
  paymentCount: number;
  lastAmount: string;
  lastActivity: string;
  balance: string;
}

export default function AdminUserWalletsPage() {
  const { showToast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [walletsRefreshInterval, setWalletsRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  // Helper function to format USDT balance based on chain
  const formatUsdtBalance = (balance: string, chain: string): string => {
    if (!balance || balance === "0" || balance === "0.00") {
      return "0.00";
    }

    try {
      const numBalance = parseFloat(balance);

      // TRON USDT has 6 decimals
      if (chain === "tron") {
        return (numBalance / 1000000).toFixed(2);
      }

      // BSC USDT has 18 decimals
      if (chain === "bsc") {
        return (numBalance / 1000000000000000000).toFixed(2);
      }

      // Ethereum USDT has 6 decimals
      if (chain === "eth") {
        return (numBalance / 1000000).toFixed(2);
      }

      // Default: assume it's already in proper format
      return numBalance.toFixed(2);
    } catch (error) {
      return "0.00";
    }
  };

  // Helper function to format payment amount (remove trailing zeros)
  const formatPaymentAmount = (amount: number | string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "0.00";

    // Format to 2 decimal places, then remove trailing zeros
    const formatted = numAmount.toFixed(2);
    return formatted.replace(/\.?0+$/, "") || "0";
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopWalletsAutoRefresh();
    };
  }, []);

  // Fetch wallet list with real-time balances
  const fetchWallets = async (showSuccessToast = false) => {
    setIsLoadingWallets(true);
    try {
      // Fetch wallet balances with credentials as query parameters
      const response = await fetch(`/api/admin/wallet-balances?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wallets");
      }

      const data = await response.json();
      console.log("📊 Wallet data received:", data);

      setWallets(data.balances);
      console.log("💼 Wallets set:", data.balances);

      if (showSuccessToast) {
        showToast("实时余额已更新", "success");
      }
    } catch (error: any) {
      console.error("❌ Error fetching wallets:", error);
      showToast(error.message || "获取钱包列表失败", "error");
    } finally {
      setIsLoadingWallets(false);
    }
  };

  // Stop wallets auto-refresh
  const stopWalletsAutoRefresh = () => {
    if (walletsRefreshInterval) {
      clearInterval(walletsRefreshInterval);
      setWalletsRefreshInterval(null);
      console.log("⏹️ Wallets auto-refresh stopped");
    }
  };

  // Handle data fetching based on tab
  useEffect(() => {
    fetchWallets();

    // Cleanup on unmount
    return () => {
      stopWalletsAutoRefresh();
    };
  }, [currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            Wallet Management
          </h2>
          <p className="text-gray-400 text-sm ml-13">
            Manage and monitor all connected wallet addresses and balances
            {walletsRefreshInterval && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Real-time updating
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchWallets(false)}
          disabled={isLoadingWallets}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <svg
            className={`w-5 h-5 ${isLoadingWallets ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoadingWallets ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Wallet Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Chain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Invested Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {isLoadingWallets ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-3 py-8">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-full"></div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-300">Loading wallet list...</div>
                    </div>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-300">No wallet records</p>
                        <p className="text-sm text-gray-500 mt-1">No wallet connections</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                wallets.map(wallet => (
                  <tr key={wallet.address} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-white">
                            {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.address);
                              showToast("Address copied", "success");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 flex items-center gap-1"
                          >
                            Copy full address
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            wallet.chain === "eth"
                              ? "bg-blue-500/10 border border-blue-500/20"
                              : wallet.chain === "bsc"
                                ? "bg-yellow-500/10 border border-yellow-500/20"
                                : "bg-red-500/10 border border-red-500/20"
                          }`}
                        >
                          <img
                            src={`/chains/${wallet.chain}.svg`}
                            alt={wallet.chain}
                            className="w-5 h-5"
                            onError={e => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">{wallet.chain.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/coins/${wallet.currency.toLowerCase()}.svg`}
                          alt={wallet.currency}
                          className="w-4 h-4"
                          onError={e => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="text-sm font-semibold text-gray-300 font-mono">
                          {formatPaymentAmount(wallet.investedAmount || "0")}
                        </span>
                        <span className="text-xs text-gray-400">{wallet.currency.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/coins/${wallet.currency.toLowerCase()}.svg`}
                          alt={wallet.currency}
                          className="w-4 h-4"
                          onError={e => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="text-sm font-semibold text-gray-300 font-mono">
                          {formatPaymentAmount(wallet.lastAmount || "0")}
                        </span>
                        <span className="text-xs text-gray-400">{wallet.currency.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                          wallet.status === "invested"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : wallet.status === "not_invested"
                              ? "bg-gray-500/10 text-gray-300 border border-gray-500/30"
                              : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30"
                        }`}
                      >
                        {wallet.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(wallet.lastActivity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedWallet(wallet);
                          setShowTransferModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
