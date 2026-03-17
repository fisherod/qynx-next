"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import PageLayout from "@/components/PageLayout";
import BscPriceTicker from "@/components/BscPriceTicker";

const CURRENCY_OPTIONS = [
  {
    value: "usdt",
    label: "USDT",
    icon: "/coins/usdt.svg"
  },
  {
    value: "usdc",
    label: "USDC",
    icon: "/coins/usdc.svg"
  }
] as const;

export default function InvestmentPage() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<{
    user_id: string;
    currency: string;
    amount: string;
  }>({
    user_id: "1234567890",
    currency: CURRENCY_OPTIONS[0].value,
    amount: ""
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      // Prepare payment data
      const paymentData = {
        user_id: formData.user_id,
        currency: formData.currency,
        amount: parseFloat(formData.amount)
      };

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const data = await response.json();
      setResult(data);
      setSuccess("Payment link generated successfully!");
    } catch (error: any) {
      console.error("Payment creation error:", error);
      setError(error.message || "Failed to generate payment link, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Link copied to clipboard");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Failed to copy, please copy manually");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30";

  return (
    <PageLayout showNavbar={false}>
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Start your crypto investment</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose your coin, set the amount, and instantly generate a secure payment link to fund your investment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
              {/* Currency / Network */}
              <div>
                <label className="block text-white font-medium mb-2">Currency</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(o => !o)}
                    className={`w-full px-4 py-3 rounded-lg border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 flex items-center justify-between gap-3 ${dropdownOpen ? "border-purple-500 ring-2 ring-purple-500/30" : "border-gray-700 focus:border-purple-500"}`}
                  >
                    {(() => {
                      const opt = CURRENCY_OPTIONS.find(o => o.value === formData.currency) ?? CURRENCY_OPTIONS[0];
                      return (
                        <span className="flex items-center gap-3">
                          <span className="relative w-8 h-8 rounded-full overflow-hidden bg-[#26A17B] flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={opt.icon}
                              alt=""
                              width={32}
                              height={32}
                              className="object-cover relative z-10"
                              onError={e => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <span className="absolute inset-0 z-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none">
                              T
                            </span>
                          </span>
                          <span className="font-medium">{opt.label}</span>
                        </span>
                      );
                    })()}
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-xl overflow-hidden">
                      {CURRENCY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormData(f => ({ ...f, currency: opt.value }));
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700/80  text-white transition-colors ${formData.currency === opt.value ? "bg-gray-700/50" : ""}`}
                        >
                          <span className="relative w-8 h-8 rounded-full overflow-hidden bg-[#26A17B] flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={opt.icon}
                              alt=""
                              width={32}
                              height={32}
                              className="object-cover relative z-10"
                              onError={e => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <span className="absolute inset-0 z-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none">
                              T
                            </span>
                          </span>
                          <span className="font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-white font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  max="10000"
                  step="0.01"
                  className={inputClass}
                  placeholder="e.g. 100"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {loading ? "Generating..." : "Invest Now"}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <div className="text-red-300">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {/* {success && (
            <div className="max-w-2xl mx-auto mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
              <div className="text-green-300">{success}</div>
            </div>
          )} */}

          {/* Result */}
          {result && (
            <div className="max-w-2xl mx-auto mt-8 space-y-4">
              {/* QR Code */}
              {result.qr_code && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <label className="block text-gray-300 text-sm mb-2">QR code (scan with phone):</label>
                  <div className="flex justify-center">
                    <img
                      src={result.qr_code}
                      alt="Payment QR Code"
                      className="w-48 h-48 border border-gray-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Payment Link */}
              <div className="text-center">
                <Link
                  href={result.payment_url}
                  target="_blank"
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span className="mr-2">🔗</span>
                  Open payment link
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <BscPriceTicker />
    </PageLayout>
  );
}
