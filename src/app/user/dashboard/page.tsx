"use client";

import React, { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import BscPriceTicker from "@/components/BscPriceTicker";
import { ROI_DAILY } from "@/constants/app";

interface DashboardData {
  usdBalance: number;
  profit: number;
  completedPayments: number;
}

export default function UserDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatAmount = (value: number) => {
    if (!Number.isFinite(value)) return "0.00";
    const formatted = value.toFixed(2);
    return formatted.replace(/\.?0+$/, "") || "0";
  };

  const roiDailyPercent = (ROI_DAILY * 100).toFixed(3).replace(/\.?0+$/, "");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/dashboard", { method: "GET" });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to load dashboard data");
        }
        setData(json);
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <PageLayout showNavbar={false}>
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Investment Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Overview of your current balance, profits, and completed investments.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-gray-300 text-sm">Loading your dashboard...</p>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto p-4 bg-red-900/40 border border-red-700/60 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* USD Balance */}
              <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">USD Balance</span>
                  <span className="text-yellow-400 text-lg">$</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-emerald-300">
                  ${formatAmount(data.usdBalance)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total capital currently invested</p>
              </div>

              {/* Profit */}
              <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Profit</span>
                  <span className="text-yellow-400 text-lg">★</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-mono font-semibold text-blue-300">${formatAmount(data.profit)}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/60">
                      ↑
                    </span>
                    <span>+{roiDailyPercent}%</span>
                    <span>/ day</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Accumulated profit in USD</p>
              </div>

              {/* Completed Payments */}
              <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Completed Payments
                  </span>
                  <span className="text-green-400 text-lg">✓</span>
                </div>
                <div className="text-2xl font-mono font-semibold text-white">{data.completedPayments}</div>
                <p className="text-xs text-gray-500 mt-1">Total successfully completed investment orders</p>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <BscPriceTicker />
    </PageLayout>
  );
}
