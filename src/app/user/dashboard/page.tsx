"use client";

import React from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import BscPriceTicker from "@/components/BscPriceTicker";

export default function DashboardPage() {
  return (
    <PageLayout showNavbar={false}>
      <div className="min-h-screen">
        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Blockchain payment API service
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Provides a simple, secure, and reliable USDT payment API interface, supporting functions such as creating payment links, status queries, and callback notifications.
            </p>
          </div>

          {/* API Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-2xl mb-3">🔗</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Create payment link
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Quickly create USDT payment links via API, supporting custom amounts and callback addresses.
              </p>
              <code className="text-xs text-green-400 bg-gray-900 px-2 py-1 rounded">
                POST /api/payment/create
              </code>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Status query</h3>
              <p className="text-gray-400 text-sm mb-4">
                  Real-time payment status tracking, supporting statuses such as pending payment, processing, completed, and failed.
              </p>
              <code className="text-xs text-blue-400 bg-gray-900 px-2 py-1 rounded">
                GET /api/payment/[id]/status
              </code>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-white mb-2">Automatic callback</h3>
              <p className="text-gray-400 text-sm mb-4">
                  Automatic notifications to your system when payment status changes ensure timely response in business processes.
              </p>
              <code className="text-xs text-purple-400 bg-gray-900 px-2 py-1 rounded">
                POST /webhook/callback
              </code>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-2xl mb-3">🌐</div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-chain support</h3>
              <p className="text-gray-400 text-sm mb-4">
                  Supports USDT payments on the three major blockchain networks: BSC, Ethereum, and Tron.
              </p>
              <div className="flex space-x-2">
                <span className="text-xs text-yellow-400 bg-gray-900 px-2 py-1 rounded">
                  BSC
                </span>
                <span className="text-xs text-blue-400 bg-gray-900 px-2 py-1 rounded">
                  ETH
                </span>
                <span className="text-xs text-red-400 bg-gray-900 px-2 py-1 rounded">
                  TRON
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/generate"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  suppressHydrationWarning
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Generate payment link
              </Link>

              <Link
                href="/api/health"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  suppressHydrationWarning
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                API Status Check
              </Link>

              <Link
                href="/api/config"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  suppressHydrationWarning
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configuration information
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              API base address: <code className="text-gray-300">/api/*</code>
            </p>
          </div>
        </main>
      </div>
      
      <BscPriceTicker />
    </PageLayout>
  )
}
