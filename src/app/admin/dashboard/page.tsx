"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from 'next/navigation'
import PageLayout from '@/components/PageLayout'
import { createPortal } from 'react-dom'
import BscPriceTicker from '@/components/BscPriceTicker'
import { useToast } from "@/components/ui/Toast";
import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/tradings', label: 'Tradings' },
  { href: '/admin/presale', label: 'Presale' },
  { href: '/admin/distributions', label: 'Distributions' },
  { href: '/admin/withdrawals', label: 'Withdrawals' },
  { href: '/admin/settings', label: 'Settings' },
] as const

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

  const handleLogout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUsername')
    }
    router.replace('/sign-in')
  }
  const pathname = usePathname()

  const [projects, setProjects] = useState<Project[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState<
    "projects" | "wallets" | "payment-config"
  >("projects");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
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
  const headerRef = useRef<HTMLElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const [mobileDropdownPosition, setMobileDropdownPosition] = useState({ top: 0 })

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
    <PageLayout showNavbar={false}>
      <div className="relative z-40 min-h-screen flex flex-col">
      <header ref={headerRef} className="relative z-40 px-5 xs:px-6 sm:px-6 py-4 sm:py-6 border-b border-white/10 max-w-[100vw] overflow-x-hidden overflow-y-visible">
          <div className="max-w-[1200px] mx-auto flex items-center gap-3 min-w-0">
            <Link href="/" className="group flex items-center gap-2.5 text-white no-underline transition-opacity shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/logo.png" alt="" width={48} height={48} className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              </div>
              <span className="text-xl sm:text-2xl font-semibold tracking-tight group-hover:opacity-90">Qynx</span>
            </Link>

            <div ref={mobileNavRef} className="flex-1 min-w-0 flex justify-center -mx-1 px-1 relative">
              <div className="flex items-center gap-1.5 sm:gap-3 min-h-[44px] overflow-x-auto scrollbar-hide w-full sm:w-auto">
                {/* Mobile: hamburger on the right */}
                <div className="flex sm:hidden items-center gap-2 min-w-0 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMobileNavOpen((o) => !o)
                    }}
                    className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Toggle menu"
                    aria-expanded={mobileNavOpen}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mobileNavOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
                {/* Desktop: full nav pill */}
                <nav className="hidden sm:flex gap-1.5 p-1 bg-white/5 rounded-xl shrink-0">
                  {NAV.map(({ href, label }) => {
                    const active = pathname === href || pathname === href + '/' || (href !== '/admin' && pathname?.startsWith(href))
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`py-2.5 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          active ? 'text-white font-semibold' : 'text-[#C8C8C8] hover:bg-white/5 hover:text-white'
                        }`}
                        style={active ? { background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' } : undefined}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="flex sm:hidden items-center gap-1.5 shrink-0 border-l border-white/10 pl-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 rounded-lg text-[#C8C8C8] text-sm font-medium border border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
                >
                  Logout
                </button>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 rounded-lg text-[#C8C8C8] text-sm font-medium border border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        {/* Mobile nav dropdown: portaled to body so it's not clipped by header */}
        {mobileNavOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={mobileDropdownRef}
              className="sm:hidden fixed left-0 right-0 border-t border-white/10 bg-[#1a1a24] backdrop-blur-sm z-[60] shadow-xl max-h-[70vh] overflow-y-auto"
              style={{ top: mobileDropdownPosition.top, maxHeight: mobileDropdownPosition.top ? `calc(100vh - ${mobileDropdownPosition.top}px)` : undefined }}
            >
              <div className="max-w-[1200px] mx-auto px-5 xs:px-6 py-3 flex flex-col gap-0.5">
                {NAV.map(({ href, label }) => {
                  const active = pathname === href || pathname === href + '/' || (href !== '/admin' && pathname?.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'text-white font-semibold' : 'text-[#C8C8C8] hover:bg-white/5 hover:text-white'
                      }`}
                      style={active ? { background: 'linear-gradient(90deg, #6B46C1 0%, #A78BFA 100%)' } : undefined}
                    >
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>,
            document.body
          )}
        <div className="min-h-screen">
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
                  Project Records
                </button>
                <button
                  onClick={() => setActiveTab("wallets")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "wallets"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Wallet Management
                </button>
                    <button
                      onClick={() => setActiveTab("payment-config")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "payment-config"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Fee Wallet
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
                      Payment Transaction Records
                    </h2>
                    <p className="text-gray-400 text-sm ml-13">
                      {totalItems > 0 ? `Total ${totalItems} transaction records` : "View and manage all payment transactions"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Payment ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Amount (USDT)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Created Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
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
                                <div className="text-sm font-medium text-gray-300">Loading payment records...</div>
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
                                  <p className="text-lg font-medium text-gray-300">No payment records</p>
                                  <p className="text-sm text-gray-500 mt-1">No transaction records</p>
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
                                        showToast("Payment ID copied", "success");
                                      }}
                                      className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 flex items-center gap-1"
                                    >
                                      Copy full ID
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
                                    ? "✓ Completed"
                                    : project.status === "pending"
                                    ? "⏳ Pending"
                                    : project.status === "processing"
                                    ? "⚙ Processing"
                                    : project.status === "failed"
                                    ? "✗ Failed"
                                    : project.status === "expired"
                                    ? "⏰ Expired"
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
                                  View Details
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
                        Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-white font-medium">{totalItems}</span> records
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
                          Previous Page
                        </button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
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
                          Next Page
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
                    {isLoadingWallets ? "Refreshing..." : "Refresh Balance"}
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
                            USDT Balance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Requested USDT Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions
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
                                <div className="text-sm font-medium text-gray-300">Loading wallet list...</div>
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
                                  <p className="text-lg font-medium text-gray-300">No wallet records</p>
                                  <p className="text-sm text-gray-500 mt-1">No wallet connections</p>
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
                                        showToast("Address copied", "success");
                                      }}
                                      className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 flex items-center gap-1"
                                    >
                                      Copy full address
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
                      Fee Wallet Monitoring
                    </h2>
                    <p className="text-gray-400 text-sm ml-13">
                      Monitor and manage the main wallet balances used for payment transaction fees
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
                    {isLoadingOwnerBalances ? "Refreshing..." : "Refresh All Balances"}
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
                      <div className="text-lg font-medium text-gray-300">Loading wallet information...</div>
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
                                <p className="text-xs text-gray-400">Fee Wallet</p>
                              </div>
                            </div>
                            {isLowBalance && (
                              <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <span className="text-xs font-medium text-red-400">Insufficient Balance</span>
                              </div>
                            )}
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
                              View in Blockchain Explorer
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
                                Used for payment of transaction fees on the {chain === "tron" ? "TRON" : chain === "bsc" ? "BSC" : "Ethereum"} network
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
                              <p className="text-xs text-gray-500">USDT Token Balance</p>
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
                        <p className="text-lg font-medium text-gray-300">Fee Wallet Not Configured</p>
                        <p className="text-sm text-gray-500 mt-1">Please contact the administrator to configure the wallet address</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>      
      <BscPriceTicker />
    </PageLayout>
  )
}
