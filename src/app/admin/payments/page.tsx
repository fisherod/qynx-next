"use client";

import React, { useState, useEffect } from "react";
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

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [walletsRefreshInterval, setWalletsRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);

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

  // Fetch projects with pagination
  const fetchProjects = async (page: number = currentPage) => {
    setIsLoadingProjects(true);
    try {
      // Fetch payments with pagination
      const response = await fetch(`/api/admin/payments?page=${page}&limit=${itemsPerPage}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      // Ensure payments is an array
      if (!data || typeof data !== "object") {
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

  // Stop wallets auto-refresh
  const stopWalletsAutoRefresh = () => {
    if (walletsRefreshInterval) {
      clearInterval(walletsRefreshInterval);
      setWalletsRefreshInterval(null);
      console.log("⏹️ Wallets auto-refresh stopped");
    }
  };

  // Fetch payment details
  const fetchPaymentDetails = async (paymentId: string) => {
    setIsLoadingPaymentDetails(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/details`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

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

  useEffect(() => {
    fetchProjects(currentPage);
    stopWalletsAutoRefresh();
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <img
                          src="/icons/tether.svg"
                          alt="USDT"
                          className="w-4 h-4"
                          onError={e => {
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
                            day: "2-digit"
                          })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(project.created_at).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit"
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{" "}
              <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
              <span className="text-white font-medium">{totalItems}</span> records
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
