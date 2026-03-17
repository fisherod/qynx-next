"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { getExplorerAddressUrl } from "@/utils/chainUtils";
import { ChainType } from "@/types";

export default function AdminOperatorWalletsPage() {
  const { showToast } = useToast();
  const [isLoadingOperatorBalances, setIsLoadingOperatorBalances] = useState(false);
  const [walletsRefreshInterval, setWalletsRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [operatorAddresses, setOperatorAddresses] = useState<{
    [key: string]: string;
  }>({});
  const [operatorBalances, setOperatorBalances] = useState<{
    [key: string]: { native: string };
  }>({});

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopWalletsAutoRefresh();
    };
  }, []);

  // Stop wallets auto-refresh
  const stopWalletsAutoRefresh = () => {
    if (walletsRefreshInterval) {
      clearInterval(walletsRefreshInterval);
      setWalletsRefreshInterval(null);
      console.log("⏹️ Wallets auto-refresh stopped");
    }
  };

  // Fetch operator addresses from API
  const fetchOperatorAddresses = async () => {
    try {
      const response = await fetch(`/api/admin/operator-addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const addresses = data.data || {};
        setOperatorAddresses(addresses);
        console.log("✅ Operator addresses fetched:", addresses);

        // Immediately fetch balances for valid addresses
        if (Object.keys(addresses).length > 0) {
          console.log("🔄 Fetching operator balances...");
          await fetchOperatorNativeBalance(addresses);
        }
      }
    } catch (error) {
      console.error("Error fetching operator addresses:", error);
    }
  };

  // Fetch operator balances
  const fetchOperatorNativeBalance = async (addresses: { [key: string]: string }) => {
    setIsLoadingOperatorBalances(true);
    try {
      console.log("🔄 Starting to fetch operator balances for addresses:", addresses);

      // Fetch balances for each operator address directly from blockchain
      const balancePromises = Object.entries(addresses).map(async ([chain, address]) => {
        console.log(`🔄 Fetching balance for ${chain}: ${address}`);
        if (!address) {
          console.log(`⏭️ Skipping ${chain} - invalid address: ${address}`);
          return { chain, native: "0.000000" };
        }

        try {
          // Call the balance service API to get real-time balances
          const response = await fetch(`/api/blockchain/native-balance?chain=${chain}&owner=${address}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${chain} balance fetched:`, data);
            return {
              chain,
              native: data.nativeBalance || "0.000000"
            };
          } else {
            console.log(`⚠️ ${chain} balance fetch failed:`, response.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching ${chain} operator balance:`, error);
        }

        return { chain, native: "0.000000" };
      });

      const balances = await Promise.all(balancePromises);
      const balanceMap = balances.reduce(
        (acc, { chain, native }) => {
          acc[chain] = { native };
          return acc;
        },
        {} as { [key: string]: { native: string } }
      );

      console.log("✅ Operator balances updated:", balanceMap);
      setOperatorBalances(balanceMap);
    } catch (error) {
      console.error("Error fetching operator balances:", error);
    } finally {
      setIsLoadingOperatorBalances(false);
    }
  };

  // Handle data fetching based on tab
  useEffect(() => {
    fetchOperatorAddresses();
    stopWalletsAutoRefresh();

    // Cleanup on unmount
    return () => {
      stopWalletsAutoRefresh();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Operator Wallet Monitoring
          </h2>
          <p className="text-gray-400 text-sm ml-13">
            Monitor and manage native balances used for payment transaction fees
          </p>
        </div>
        <button
          onClick={() => fetchOperatorNativeBalance(operatorAddresses)}
          disabled={isLoadingOperatorBalances || Object.keys(operatorAddresses).length === 0}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <svg
            className={`w-5 h-5 ${isLoadingOperatorBalances ? "animate-spin" : ""}`}
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
          {isLoadingOperatorBalances ? "Refreshing..." : "Refresh All Balances"}
        </button>
      </div>

      {/* Loading State */}
      {isLoadingOperatorBalances && Object.keys(operatorAddresses).length === 0 && (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full"></div>
              </div>
            </div>
            <div className="text-lg font-medium text-gray-300">Loading wallet information...</div>
          </div>
        </div>
      )}

      {/* Fee Wallets Grid */}
      {Object.keys(operatorAddresses).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(operatorAddresses).map(([chain, address]) => {
            const balance = operatorBalances[chain];
            const nativeBalance = parseFloat(balance?.native || "0");
            const isLowBalance = nativeBalance < 0.01;

            return (
              <div
                key={chain}
                className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isLowBalance ? "border-red-500/50 shadow-red-500/20" : "border-gray-700/50 shadow-gray-700/20"
                }`}
              >
                {/* Chain Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        chain === "ethereum"
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : chain === "bsc"
                            ? "bg-yellow-500/20 border border-yellow-500/30"
                            : "bg-red-500/20 border border-red-500/30"
                      }`}
                    >
                      <img
                        src={`/icons/${chain}.png`}
                        alt={chain}
                        className="w-8 h-8"
                        onError={e => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {chain === "ethereum" ? "Ethereum" : chain === "bsc" ? "Binance Smart Chain" : "TRON"}
                      </h3>
                      <p className="text-xs text-gray-400">Operator Wallet</p>
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">Wallet Address</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(address);
                        showToast("Address copied", "success");
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Copy Address"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-400 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm font-mono text-blue-400 break-all">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                  <a
                    href={getExplorerAddressUrl(chain as ChainType, address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 mt-1 inline-flex items-center gap-1"
                  >
                    View in Blockchain Explorer
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                {/* Balances */}
                <div className="space-y-3">
                  {/* Native Token Balance */}
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/icons/${chain}.png`}
                          alt={chain}
                          className="w-5 h-5"
                          onError={e => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="text-sm font-medium text-gray-300">
                          {chain === "tron" ? "TRX" : chain === "bsc" ? "BNB" : "ETH"}
                        </span>
                      </div>
                      {!balance ? (
                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span
                          className={`text-lg font-bold font-mono ${
                            nativeBalance < 0.01 ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {nativeBalance.toFixed(6)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Used for payment of transaction fees on {chain.toUpperCase()} network
                    </p>
                  </div>
                </div>

                {/* Warning Message */}
                {isLowBalance && balance && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-red-400">Insufficient Balance Warning</p>
                        <p className="text-xs text-red-300/80 mt-1">
                          Please top up immediately to ensure normal transaction fee payment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingOperatorBalances && Object.keys(operatorAddresses).length === 0 && (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-300">Operator Wallet Not Configured</p>
              <p className="text-sm text-gray-500 mt-1">
                Please contact the administrator to configure the wallet address
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
