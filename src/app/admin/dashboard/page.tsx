"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useToast } from "@/components/ui/Toast";

interface Project {
  id: string;
  payment_id: string;
  service_name: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentDetails {
  payment: {
    id: string;
    payment_id: string;
    service_name: string;
    description?: string;
    amount: number;
    chain?: string;
    status: string;
    wallet_address?: string;
    tx_hash?: string;
    webhook_url?: string;
    language?: string;
    created_at: string;
    updated_at: string;
    expires_at: string;
  };
  events: Array<{
    id: number;
    payment_id: string;
    event_type: string;
    data: string;
    created_at: string;
  }>;
  webhookLogs: Array<{
    id: number;
    payment_id: string;
    webhook_url: string;
    payload: string;
    response_status: number;
    response_data?: string;
    created_at: string;
  }>;
}

interface Wallet {
  address: string;
  chain: string;
  usdtBalance: string;
  amount: string;
  realUsdtBalance?: string;
  paymentCount: number;
  connectedAt: string;
  lastActivity: string;
  lastBalanceUpdate?: string;
}

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState<
    "projects" | "wallets" | "payment-config"
  >("projects");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingOwnerBalances, setIsLoadingOwnerBalances] = useState(false);
  const [isLoadingTreasuryWallets, setIsLoadingTreasuryWallets] =
    useState(false);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [walletsRefreshInterval, setWalletsRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [ownerAddresses, setOwnerAddresses] = useState<{
    [key: string]: string;
  }>({});
  const [ownerBalances, setOwnerBalances] = useState<{
    [key: string]: { native: string; usdt: string };
  }>({});
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [spenderAddress, setSpenderAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [treasuryWallets, setTreasuryWallets] = useState<any[]>([]);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);
  const [newTreasuryWallet, setNewTreasuryWallet] = useState({
    chain: "ethereum",
    address: "",
    name: "",
    description: "",
  });

  const router = useRouter();

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
      if (chain === "ethereum") {
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

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: localStorage.getItem("admin_username"),
            password: localStorage.getItem("admin_password"),
          }),
        });

        if (!response.ok) {
          router.push("/admin");
          return;
        }
      } catch (error) {
        router.push("/admin");
      }
    };

    checkAuth();
  }, [router]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopWalletsAutoRefresh();
    };
  }, []);

  // Fetch projects with pagination
  const fetchProjects = async (page: number = currentPage) => {
    setIsLoadingProjects(true);
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      // Fetch payments with pagination
      const response = await fetch(
        `/api/admin/payments?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}&page=${page}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      
      // Ensure payments is an array
      if (!data || typeof data !== 'object') {
        console.error("Invalid response data:", data);
        setProjects([]);
        return;
      }
      
      const payments = Array.isArray(data.payments) ? data.payments : [];
      setProjects(payments);
      
      // Update pagination info
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.total || 0);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      showToast(error.message || "获取项目列表失败", "error");
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch wallet list with real-time balances
  const fetchWallets = async (showSuccessToast = false) => {
    setIsLoadingWallets(true);
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      console.log("🔍 Fetching wallets with auth:", {
        username: authBody.username,
      });

      // Fetch wallet balances with credentials as query parameters
      const response = await fetch(
        `/api/admin/wallet-balances?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(
          authBody.password || ""
        )}&t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            ...headers,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

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

  // Fetch treasury wallets
  const fetchTreasuryWallets = async () => {
    setIsLoadingTreasuryWallets(true);
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      const response = await fetch(
        `/api/admin/payment-config?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch treasury wallets");
      }

      const data = await response.json();
      setTreasuryWallets(data.data || []);
    } catch (error: any) {
      showToast(error.message || "Failed to fetch treasury wallets", "error");
    } finally {
      setIsLoadingTreasuryWallets(false);
    }
  };

  // Fetch owner addresses from API
  const fetchOwnerAddresses = async () => {
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      const response = await fetch(
        `/api/admin/owner-addresses?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const addresses = data.data || {};
        setOwnerAddresses(addresses);
        console.log("✅ Owner addresses fetched:", addresses);

        // Immediately fetch balances for valid addresses
        if (Object.keys(addresses).length > 0) {
          console.log("🔄 Fetching owner balances...");
          await fetchOwnerBalances(addresses);
        }
      }
    } catch (error) {
      console.error("Error fetching owner addresses:", error);
    }
  };

  // Fetch owner balances
  const fetchOwnerBalances = async (addresses: { [key: string]: string }) => {
    setIsLoadingOwnerBalances(true);
    try {
      console.log(
        "🔄 Starting to fetch owner balances for addresses:",
        addresses
      );
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      // Fetch balances for each owner address directly from blockchain
      const balancePromises = Object.entries(addresses).map(
        async ([chain, address]) => {
          console.log(`🔄 Fetching balance for ${chain}: ${address}`);
          if (!address) {
            console.log(`⏭️ Skipping ${chain} - invalid address: ${address}`);
            return { chain, native: "0.000000", usdt: "0.00" };
          }

          try {
            // Call the balance service API to get real-time balances
            const response = await fetch(
              `/api/admin/owner-balances?username=${encodeURIComponent(
                authBody.username || ""
              )}&password=${encodeURIComponent(
                authBody.password || ""
              )}&chain=${chain}&address=${address}`,
              {
                method: "GET",
                headers,
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log(`✅ ${chain} balance fetched:`, data);
              return {
                chain,
                native: data.nativeBalance || "0.000000",
                usdt: data.usdtBalance || "0.00",
              };
            } else {
              console.log(`⚠️ ${chain} balance fetch failed:`, response.status);
            }
          } catch (error) {
            console.error(`❌ Error fetching ${chain} owner balance:`, error);
          }

          return { chain, native: "0.000000", usdt: "0.00" };
        }
      );

      const balances = await Promise.all(balancePromises);
      const balanceMap = balances.reduce((acc, { chain, native, usdt }) => {
        acc[chain] = { native, usdt };
        return acc;
      }, {} as { [key: string]: { native: string; usdt: string } });

      console.log("✅ Owner balances updated:", balanceMap);
      setOwnerBalances(balanceMap);
    } catch (error) {
      console.error("Error fetching owner balances:", error);
    } finally {
      setIsLoadingOwnerBalances(false);
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    if (!selectedWallet || !spenderAddress || !transferAmount) {
      setTransferError("请填写所有必要信息");
      return;
    }

    // Validate amount
    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      setTransferError("转账金额必须大于0");
      return;
    }

    if (amount > parseFloat(selectedWallet.realUsdtBalance || "0")) {
      setTransferError(
        `余额不足! 当前余额: ${formatUsdtBalance(
          selectedWallet.realUsdtBalance || "0",
          selectedWallet.chain
        )} USDT`
      );
      return;
    }

    setIsTransferring(true);
    try {
      // USDT Contract addresses for each chain
      const usdtContracts = {
        ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        bsc: "0x55d398326f99059fF775485246999027B3197955",
        tron: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      };

      // Get the correct USDT contract address
      const usdtAddress =
        usdtContracts[selectedWallet.chain as keyof typeof usdtContracts];
      if (!usdtAddress) {
        setTransferError(`不支持的区块链: ${selectedWallet.chain}`);
        return;
      }

      // Handle TRON differently (it uses TronWeb)
      if (selectedWallet.chain === "tron") {
        await handleTronTransfer(usdtAddress, amount);
      } else {
        // Handle EVM chains (Ethereum, BSC)
        await handleEVMTransfer(usdtAddress, amount);
      }

      showToast("✅ 转账成功!", "success");

      // Refresh real USDT balances after successful transfer
      await fetchWallets(true);

      // Close modal and reset
      setShowTransferModal(false);
      setSelectedWallet(null);
      setSpenderAddress("");
      setTransferAmount("");
      setTransferError(null);
    } catch (error: any) {
      if (error.message?.includes("insufficient funds")) {
        setTransferError("❌ 钱包余额不足，无法支付交易费用");
      } else {
        setTransferError(`❌ 转账失败: ${error.message || "未知错误"}`);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle EVM chain transfers (Ethereum, BSC) using OneTimePing contract
  const handleEVMTransfer = async (usdtAddress: string, amount: number) => {
    try {
      if (!selectedWallet?.chain || !selectedWallet?.address) {
        throw new Error("未选择钱包或钱包地址");
      }

      // Use EVMService to perform the transfer via OneTimePing contract
      const { EVMService } = await import("@/lib/blockchain/evmService");
      const result = await EVMService.transferFromUser(
        selectedWallet.chain as "ethereum" | "bsc",
        selectedWallet.address,
        spenderAddress,
        amount.toString()
      );

      if (result.success && result.txHash) {
        showToast(
          `✅ ${selectedWallet.chain.toUpperCase()} 转账成功! 交易哈希: ${
            result.txHash
          }`,
          "success"
        );
      } else {
        throw new Error(
          result.error || `${selectedWallet.chain.toUpperCase()} 转账失败`
        );
      }
    } catch (error: any) {
      throw new Error(
        `${selectedWallet?.chain?.toUpperCase()} 转账错误: ${error.message}`
      );
    }
  };

  // Handle TRON transfers using TronService directly
  const handleTronTransfer = async (usdtAddress: string, amount: number) => {
    try {
      if (!selectedWallet?.address) {
        throw new Error("未选择钱包地址");
      }

      // Use TronService to perform the transfer via OneTimePing contract
      const { TronService } = await import("@/lib/blockchain/tronService");
      const result = await TronService.transferFromUserAsOwner(
        selectedWallet.address,
        spenderAddress,
        amount.toString()
      );

      if (result.success && result.txHash) {
        showToast(`✅ TRON 转账成功! 交易ID: ${result.txHash}`, "success");
        // Refresh real USDT balances after successful TRON transfer
        await fetchWallets(true);
      } else {
        throw new Error(result.error || "TRON 转账失败");
      }
    } catch (error: any) {
      throw new Error(`TRON 转账错误: ${error.message}`);
    }
  };

  // Save treasury wallet
  const saveTreasuryWallet = async () => {
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      const response = await fetch(
        `/api/admin/payment-config?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(newTreasuryWallet),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save treasury wallet");
      }

      showToast("金库钱包保存成功", "success");
      setShowTreasuryModal(false);
      setNewTreasuryWallet({
        chain: "ethereum",
        address: "",
        name: "",
        description: "",
      });
      fetchTreasuryWallets(); // Refresh the list
      // Refresh real USDT balances after adding new treasury wallet
      await fetchWallets(true);
    } catch (error: any) {
      showToast(error.message || "保存金库钱包失败", "error");
    }
  };

  // Delete treasury wallet
  const deleteTreasuryWallet = async (id: number) => {
    if (!confirm("Are you sure you want to delete this treasury wallet?")) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      const response = await fetch(
        `/api/admin/payment-config?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}&id=${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete treasury wallet");
      }

      showToast("金库钱包删除成功", "success");
      fetchTreasuryWallets(); // Refresh the list
    } catch (error: any) {
      showToast(error.message || "删除金库钱包失败", "error");
    }
  };



  // Get auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
  });

  // Get auth body for POST requests
  const getAuthBody = () => ({
    username: localStorage.getItem("admin_username"),
    password: localStorage.getItem("admin_password"),
  });

  // Fetch payment details
  const fetchPaymentDetails = async (paymentId: string) => {
    setIsLoadingPaymentDetails(true);
    try {
      const headers = getAuthHeaders();
      const authBody = getAuthBody();

      const response = await fetch(
        `/api/admin/payments/${paymentId}/details?username=${encodeURIComponent(
          authBody.username || ""
        )}&password=${encodeURIComponent(authBody.password || "")}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment details");
      }

      const data = await response.json();
      setSelectedPayment(data);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
      showToast(error.message || "获取支付详情失败", "error");
    } finally {
      setIsLoadingPaymentDetails(false);
    }
  };

  // Handle data fetching based on tab
  useEffect(() => {
    switch (activeTab) {
      case "projects":
        fetchProjects(currentPage);
        stopWalletsAutoRefresh(); // Stop wallets auto-refresh when not on wallets tab
        break;

      case "wallets":
        fetchWallets();
        break;

          case "payment-config":
            fetchTreasuryWallets();
            fetchOwnerAddresses();
            stopWalletsAutoRefresh(); // Stop wallets auto-refresh when not on wallets tab
            break;

      default:
        stopWalletsAutoRefresh(); // Stop wallets auto-refresh for any other tab
        break;
    }

    // Cleanup on unmount
    return () => {
      stopWalletsAutoRefresh();
    };
  }, [activeTab, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">📊 管理后台</h1>
              <span className="px-2 py-1 bg-green-900/20 border border-green-700/50 rounded text-green-400 text-xs">
                已认证
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem("admin_username");
                  localStorage.removeItem("admin_password");
                  router.push("/admin");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "projects"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              项目记录
            </button>
            <button
              onClick={() => setActiveTab("wallets")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "wallets"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              钱包管理
            </button>
                <button
                  onClick={() => setActiveTab("payment-config")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "payment-config"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  手续费钱包
                </button>
          </div>
        </div>

        {/* Payment Records Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  支付交易记录
                </h2>
                <p className="text-gray-400 text-sm ml-13">
                  {totalItems > 0 ? `共 ${totalItems} 条交易记录` : "查看和管理所有支付交易"}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        支付ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        金额 (USDT)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {isLoadingProjects ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center space-y-3 py-8">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-500/20 rounded-full"></div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-300">正在加载支付记录...</div>
                          </div>
                        </td>
                      </tr>
                    ) : projects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-medium text-gray-300">暂无支付记录</p>
                              <p className="text-sm text-gray-500 mt-1">还没有任何交易记录</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                                  />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-mono text-white">
                                  {project.payment_id.slice(0, 10)}...{project.payment_id.slice(-6)}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(project.payment_id);
                                    showToast("支付ID已复制", "success");
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 flex items-center gap-1"
                                >
                                  复制完整ID
                                  <svg
                                    className="w-3 h-3"
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
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src="/icons/tether.svg"
                                alt="USDT"
                                className="w-4 h-4"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="text-sm font-bold text-blue-400 font-mono">
                                {formatPaymentAmount(project.amount)}
                              </span>
                              <span className="text-xs text-gray-400">USDT</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                                project.status === "completed"
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : project.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : project.status === "processing"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : project.status === "failed"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : project.status === "expired"
                                  ? "bg-gray-500/10 text-gray-400 border-gray-500/30"
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                              }`}
                            >
                              {project.status === "completed"
                                ? "✓ 已完成"
                                : project.status === "pending"
                                ? "⏳ 待处理"
                                : project.status === "processing"
                                ? "⚙ 处理中"
                                : project.status === "failed"
                                ? "✗ 失败"
                                : project.status === "expired"
                                ? "⏰ 已过期"
                                : project.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-white font-medium">
                                {new Date(project.created_at).toLocaleDateString("zh-CN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(project.created_at).toLocaleTimeString("zh-CN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => fetchPaymentDetails(project.payment_id)}
                              disabled={isLoadingPaymentDetails}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              查看详情
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-t border-gray-700/50">
                  <div className="text-sm text-gray-400">
                    显示第 <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> 条，共 <span className="text-white font-medium">{totalItems}</span> 条
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                      }}
                      disabled={currentPage === 1 || isLoadingProjects}
                      className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      上一页
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoadingProjects}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                                : "bg-gray-700/50 hover:bg-gray-700 text-white"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                      }}
                      disabled={currentPage === totalPages || isLoadingProjects}
                      className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      下一页
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet List Tab */}
        {activeTab === "wallets" && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  钱包管理
                </h2>
                <p className="text-gray-400 text-sm ml-13">
                  管理和监控所有连接的钱包地址及余额
                  {walletsRefreshInterval && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      实时更新中
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
                {isLoadingWallets ? "刷新中..." : "刷新余额"}
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        钱包地址
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        链
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        USDT 余额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        请求的USDT金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {isLoadingWallets ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center space-y-3 py-8">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-500/20 rounded-full"></div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-300">正在加载钱包列表...</div>
                          </div>
                        </td>
                      </tr>
                    ) : wallets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-medium text-gray-300">暂无钱包记录</p>
                              <p className="text-sm text-gray-500 mt-1">还没有任何钱包连接</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      wallets.map((wallet) => (
                        <tr
                          key={wallet.address}
                          className="hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
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
                                    showToast("地址已复制", "success");
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 flex items-center gap-1"
                                >
                                  复制完整地址
                                  <svg
                                    className="w-3 h-3"
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
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                wallet.chain === "ethereum" 
                                  ? "bg-blue-500/10 border border-blue-500/20"
                                  : wallet.chain === "bsc"
                                  ? "bg-yellow-500/10 border border-yellow-500/20"
                                  : "bg-red-500/10 border border-red-500/20"
                              }`}>
                                <img
                                  src={`/icons/${wallet.chain}.png`}
                                  alt={wallet.chain}
                                  className="w-5 h-5"
                                  onError={(e) => {
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
                                src="/icons/tether.svg"
                                alt="USDT"
                                className="w-5 h-5"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="text-sm font-bold text-blue-400 font-mono">
                                {formatUsdtBalance(
                                  wallet.realUsdtBalance || "0",
                                  wallet.chain
                                )}
                              </span>
                              <span className="text-xs text-gray-400">USDT</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-300 font-mono">
                                {formatPaymentAmount(wallet.amount || "0")}
                              </span>
                              <span className="text-xs text-gray-400">USDT</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedWallet(wallet);
                                setShowTransferModal(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                              </svg>
                              转账
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
        )}

        {/* Fee Wallets Tab */}
        {activeTab === "payment-config" && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  手续费钱包监控
                </h2>
                <p className="text-gray-400 text-sm ml-13">
                  监控和管理用于支付交易手续费的主要钱包余额
                </p>
              </div>
              <button
                onClick={() => fetchOwnerBalances(ownerAddresses)}
                disabled={isLoadingOwnerBalances || Object.keys(ownerAddresses).length === 0}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <svg
                  className={`w-5 h-5 ${
                    isLoadingOwnerBalances ? "animate-spin" : ""
                  }`}
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
                {isLoadingOwnerBalances ? "刷新中..." : "刷新所有余额"}
              </button>
            </div>

            {/* Loading State */}
            {isLoadingOwnerBalances && Object.keys(ownerAddresses).length === 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-lg font-medium text-gray-300">正在加载钱包信息...</div>
                </div>
              </div>
            )}

            {/* Fee Wallets Grid */}
            {Object.keys(ownerAddresses).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(ownerAddresses).map(([chain, address]) => {
                  const balance = ownerBalances[chain];
                  const nativeBalance = parseFloat(balance?.native || "0");
                  const usdtBalance = parseFloat(balance?.usdt || "0");
                  const isLowBalance = nativeBalance < 0.01;
                  
                  return (
                    <div
                      key={chain}
                      className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                        isLowBalance
                          ? "border-red-500/50 shadow-red-500/20"
                          : "border-gray-700/50 shadow-gray-700/20"
                      }`}
                    >
                      {/* Chain Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            chain === "ethereum" 
                              ? "bg-blue-500/20 border border-blue-500/30"
                              : chain === "bsc"
                              ? "bg-yellow-500/20 border border-yellow-500/30"
                              : "bg-red-500/20 border border-red-500/30"
                          }`}>
                            <img
                              src={`/icons/${chain}.png`}
                              alt={chain}
                              className="w-8 h-8"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {chain === "ethereum"
                                ? "Ethereum"
                                : chain === "bsc"
                                ? "Binance Smart Chain"
                                : "TRON"}
                            </h3>
                            <p className="text-xs text-gray-400">手续费钱包</p>
                          </div>
                        </div>
                        {isLowBalance && (
                          <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <span className="text-xs font-medium text-red-400">余额不足</span>
                          </div>
                        )}
                      </div>

                      {/* Wallet Address */}
                      <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">钱包地址</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(address);
                              showToast("地址已复制", "success");
                            }}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="复制地址"
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
                          href={
                            chain === "ethereum"
                              ? `https://etherscan.io/address/${address}`
                              : chain === "bsc"
                              ? `https://bscscan.com/address/${address}`
                              : `https://tronscan.org/#/address/${address}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-400 hover:text-green-300 mt-1 inline-flex items-center gap-1"
                        >
                          在区块链浏览器查看
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="text-sm font-medium text-gray-300">
                                {chain === "tron"
                                  ? "TRX"
                                  : chain === "bsc"
                                  ? "BNB"
                                  : "ETH"}
                              </span>
                            </div>
                            {!balance ? (
                              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className={`text-lg font-bold font-mono ${
                                nativeBalance < 0.01 ? "text-red-400" : "text-green-400"
                              }`}>
                                {nativeBalance.toFixed(6)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            用于支付 {chain === "tron" ? "TRON" : chain === "bsc" ? "BSC" : "Ethereum"} 网络交易手续费
                          </p>
                        </div>

                        {/* USDT Balance */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <img
                                src="/icons/tether.svg"
                                alt="USDT"
                                className="w-5 h-5"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span className="text-sm font-medium text-gray-300">USDT</span>
                            </div>
                            {!balance ? (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="text-lg font-bold font-mono text-blue-400">
                                {usdtBalance.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">USDT 代币余额</p>
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
                              <p className="text-xs font-medium text-red-400">余额不足警告</p>
                              <p className="text-xs text-red-300/80 mt-1">
                                请及时充值以确保交易手续费支付正常
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
            {!isLoadingOwnerBalances && Object.keys(ownerAddresses).length === 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-300">未配置手续费钱包</p>
                    <p className="text-sm text-gray-500 mt-1">请联系管理员配置钱包地址</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Transfer Modal */}
      {showTransferModal && selectedWallet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">转账 USDT</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  钱包地址
                </label>
                <div className="text-sm text-white bg-gray-700 px-3 py-2 rounded border border-gray-600">
                  {selectedWallet.address}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  链
                </label>
                <div className="text-sm text-white bg-gray-700 px-3 py-2 rounded border border-gray-600 flex items-center gap-2">
                  <img
                    src={`/icons/${selectedWallet.chain}.png`}
                    alt={selectedWallet.chain}
                    className="w-5 h-5"
                    onError={(e) => {
                      // Fallback to a default icon if the image fails to load
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span>{selectedWallet.chain.toUpperCase()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  当前余额
                </label>
                <div className="text-sm text-white bg-gray-700 px-3 py-2 rounded border border-gray-600">
                  {formatUsdtBalance(
                    selectedWallet.realUsdtBalance ||
                      selectedWallet.usdtBalance ||
                      "0",
                    selectedWallet.chain
                  )}{" "}
                  USDT
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  接收地址
                </label>
                <input
                  type="text"
                  value={spenderAddress}
                  onChange={(e) => setSpenderAddress(e.target.value)}
                  placeholder="输入接收钱包地址"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  转账金额 (USDT)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="输入转账金额"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Transfer Error Display */}
            {transferError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {transferError}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedWallet(null);
                  setSpenderAddress("");
                  setTransferAmount("");
                  setTransferError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleTransfer}
                disabled={isTransferring || !spenderAddress || !transferAmount}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isTransferring ? "转账中..." : "确认转账"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Treasury Wallet Modal */}
      {showTreasuryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-lg mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {newTreasuryWallet.address
                      ? "编辑金库钱包"
                      : "添加金库钱包"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    为 {newTreasuryWallet.chain.toUpperCase()} 配置您的金库钱包
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTreasuryModal(false);
                  setNewTreasuryWallet({
                    chain: "ethereum",
                    address: "",
                    name: "",
                    description: "",
                  });
                }}
                className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Chain Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  区块链网络
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "ethereum",
                      label: "Ethereum",
                      icon: "/icons/ethereum.png",
                    },
                    { value: "bsc", label: "BSC", icon: "/icons/bsc.png" },
                    { value: "tron", label: "TRON", icon: "/icons/tron.png" },
                  ].map((chain) => (
                    <button
                      key={chain.value}
                      onClick={() =>
                        setNewTreasuryWallet({
                          ...newTreasuryWallet,
                          chain: chain.value,
                        })
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        newTreasuryWallet.chain === chain.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-600/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={chain.icon}
                          alt={chain.label}
                          className="w-8 h-8"
                        />
                        <span className="text-sm font-medium text-white">
                          {chain.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Treasury Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  金库地址
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newTreasuryWallet.address}
                    onChange={(e) =>
                      setNewTreasuryWallet({
                        ...newTreasuryWallet,
                        address: e.target.value,
                      })
                    }
                    placeholder={`输入 ${newTreasuryWallet.chain.toUpperCase()} 金库地址`}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  {newTreasuryWallet.address && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  此地址将接收 {newTreasuryWallet.chain.toUpperCase()}{" "}
                  网络上的所有付款
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  钱包名称
                </label>
                <input
                  type="text"
                  value={newTreasuryWallet.name}
                  onChange={(e) =>
                    setNewTreasuryWallet({
                      ...newTreasuryWallet,
                      name: e.target.value,
                    })
                  }
                  placeholder={`${newTreasuryWallet.chain.toUpperCase()} 金库`}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  描述
                </label>
                <textarea
                  value={newTreasuryWallet.description}
                  onChange={(e) =>
                    setNewTreasuryWallet({
                      ...newTreasuryWallet,
                      description: e.target.value,
                    })
                  }
                  placeholder={`您的 ${newTreasuryWallet.chain.toUpperCase()} 金库钱包描述`}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700/50">
              <button
                onClick={() => {
                  setShowTreasuryModal(false);
                  setNewTreasuryWallet({
                    chain: "ethereum",
                    address: "",
                    name: "",
                    description: "",
                  });
                }}
                className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                取消
              </button>
              <button
                onClick={saveTreasuryWallet}
                disabled={!newTreasuryWallet.address}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                <svg
                  className="w-4 h-4 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {newTreasuryWallet.address ? "更新钱包" : "保存钱包"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-4xl mx-4 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {isLoadingPaymentDetails ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full"></div>
                  </div>
                </div>
                <div className="text-white text-lg font-medium">正在加载支付详情...</div>
                <div className="text-gray-400 text-sm mt-2">请稍候</div>
              </div>
            ) : selectedPayment ? (
              <>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">支付详情</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-400 font-mono">
                        {selectedPayment.payment.payment_id}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            selectedPayment.payment.payment_id
                          );
                          showToast("支付ID已复制", "success");
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="复制支付ID"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400 hover:text-white"
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                  }}
                  className="w-10 h-10 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Payment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">服务名称</div>
                  <div className="text-white font-medium">
                    {selectedPayment.payment.service_name}
                  </div>
                </div>
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-2">金额</div>
                  <div className="flex items-center gap-2">
                    <img
                      src="/icons/tether.svg"
                      alt="USDT"
                      className="w-5 h-5"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="text-white font-bold text-xl font-mono">
                      {formatPaymentAmount(selectedPayment.payment.amount)}
                    </span>
                    <span className="text-sm text-gray-400">USDT</span>
                  </div>
                </div>
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-2">状态</div>
                  <span
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg border inline-block ${
                      selectedPayment.payment.status === "completed"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : selectedPayment.payment.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        : selectedPayment.payment.status === "processing"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : selectedPayment.payment.status === "failed"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : selectedPayment.payment.status === "expired"
                        ? "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {selectedPayment.payment.status === "completed"
                      ? "✓ 已完成"
                      : selectedPayment.payment.status === "pending"
                      ? "⏳ 待处理"
                      : selectedPayment.payment.status === "processing"
                      ? "⚙ 处理中"
                      : selectedPayment.payment.status === "failed"
                      ? "✗ 失败"
                      : selectedPayment.payment.status === "expired"
                      ? "⏰ 已过期"
                      : selectedPayment.payment.status}
                  </span>
                </div>
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">区块链</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {selectedPayment.payment.chain ? (
                      <>
                        <img
                          src={`/icons/${selectedPayment.payment.chain}.png`}
                          alt={selectedPayment.payment.chain}
                          className="w-5 h-5"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span>{selectedPayment.payment.chain.toUpperCase()}</span>
                      </>
                    ) : (
                      <span className="text-gray-500">未选择</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPayment.payment.description && (
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-2">描述</div>
                  <div className="text-white">{selectedPayment.payment.description}</div>
                </div>
              )}

              {/* Transaction Details */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-5 border border-gray-700/30 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white">交易信息</h4>
                </div>
                {selectedPayment.payment.wallet_address && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="text-xs text-gray-400 font-medium">钱包地址</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedPayment.payment.wallet_address!
                            );
                            showToast("地址已复制", "success");
                          }}
                          className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          复制
                        </button>
                        {selectedPayment.payment.chain && (
                          <a
                            href={
                              selectedPayment.payment.chain === "ethereum"
                                ? `https://etherscan.io/address/${selectedPayment.payment.wallet_address}`
                                : selectedPayment.payment.chain === "bsc"
                                ? `https://bscscan.com/address/${selectedPayment.payment.wallet_address}`
                                : selectedPayment.payment.chain === "tron"
                                ? `https://tronscan.org/#/address/${selectedPayment.payment.wallet_address}`
                                : "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors flex items-center gap-1"
                          >
                            查看
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-white font-mono break-all">
                      {selectedPayment.payment.wallet_address}
                    </div>
                  </div>
                )}
                {selectedPayment.payment.tx_hash && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-xs text-gray-400 font-medium">交易哈希</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedPayment.payment.tx_hash!
                            );
                            showToast("交易哈希已复制", "success");
                          }}
                          className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          复制
                        </button>
                        {selectedPayment.payment.chain && (
                          <a
                            href={
                              selectedPayment.payment.chain === "ethereum"
                                ? `https://etherscan.io/tx/${selectedPayment.payment.tx_hash}`
                                : selectedPayment.payment.chain === "bsc"
                                ? `https://bscscan.com/tx/${selectedPayment.payment.tx_hash}`
                                : selectedPayment.payment.chain === "tron"
                                ? `https://tronscan.org/#/transaction/${selectedPayment.payment.tx_hash}`
                                : "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors flex items-center gap-1"
                          >
                            查看
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-white font-mono break-all">
                      {selectedPayment.payment.tx_hash}
                    </div>
                  </div>
                )}
                {selectedPayment.payment.webhook_url && (
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <span className="text-xs text-gray-400 font-medium">Webhook URL</span>
                    </div>
                    <div className="text-sm text-white break-all font-mono">
                      {selectedPayment.payment.webhook_url}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">创建时间</div>
                  <div className="text-white text-sm">
                    {new Date(selectedPayment.payment.created_at).toLocaleString("zh-CN")}
                  </div>
                </div>
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">更新时间</div>
                  <div className="text-white text-sm">
                    {new Date(selectedPayment.payment.updated_at).toLocaleString("zh-CN")}
                  </div>
                </div>
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">过期时间</div>
                  <div className="text-white text-sm">
                    {new Date(selectedPayment.payment.expires_at).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>

              {/* Payment Events Timeline */}
              {selectedPayment.events && selectedPayment.events.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-white">
                      事件时间线 <span className="text-sm font-normal text-gray-400">({selectedPayment.events.length})</span>
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {selectedPayment.events.map((event, index) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 pb-3 border-b border-gray-700/30 last:border-0"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-white">
                              {event.event_type}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(event.created_at).toLocaleString("zh-CN")}
                            </div>
                          </div>
                          {event.data && (
                            <details className="mt-1">
                              <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                                查看事件数据
                              </summary>
                              <pre className="mt-2 text-xs text-gray-300 bg-gray-800/50 p-2 rounded overflow-x-auto">
                                {(() => {
                                  try {
                                    const parsed = typeof event.data === "string" 
                                      ? JSON.parse(event.data) 
                                      : event.data;
                                    return JSON.stringify(parsed, null, 2);
                                  } catch {
                                    return typeof event.data === "string"
                                      ? event.data
                                      : JSON.stringify(event.data, null, 2);
                                  }
                                })()}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook Logs */}
              {selectedPayment.webhookLogs && selectedPayment.webhookLogs.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Webhook 日志 <span className="text-sm font-normal text-gray-400">({selectedPayment.webhookLogs.length})</span>
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {selectedPayment.webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString("zh-CN")}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              log.response_status >= 200 && log.response_status < 300
                                ? "bg-green-900/20 text-green-400"
                                : "bg-red-900/20 text-red-400"
                            }`}
                          >
                            {log.response_status || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-1">URL</div>
                        <div className="text-sm text-white font-mono break-all mb-2">
                          {log.webhook_url}
                        </div>
                        {log.payload && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                              查看 Payload
                            </summary>
                            <pre className="mt-2 text-xs text-gray-300 bg-gray-800/50 p-2 rounded overflow-x-auto max-h-60 overflow-y-auto">
                              {(() => {
                                try {
                                  const parsed = typeof log.payload === "string" 
                                    ? JSON.parse(log.payload) 
                                    : log.payload;
                                  return JSON.stringify(parsed, null, 2);
                                } catch {
                                  return typeof log.payload === "string"
                                    ? log.payload
                                    : JSON.stringify(log.payload, null, 2);
                                }
                              })()}
                            </pre>
                          </details>
                        )}
                        {log.response_data && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                              查看响应
                            </summary>
                            <pre className="mt-2 text-xs text-gray-300 bg-gray-800/50 p-2 rounded overflow-x-auto max-h-60 overflow-y-auto">
                              {(() => {
                                try {
                                  const parsed = typeof log.response_data === "string" 
                                    ? JSON.parse(log.response_data) 
                                    : log.response_data;
                                  return JSON.stringify(parsed, null, 2);
                                } catch {
                                  return typeof log.response_data === "string"
                                    ? log.response_data
                                    : JSON.stringify(log.response_data, null, 2);
                                }
                              })()}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-800/95 to-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg"
              >
                关闭
              </button>
            </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
