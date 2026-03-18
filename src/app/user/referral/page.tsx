"use client";

import React, { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import BscPriceTicker from "@/components/BscPriceTicker";

export default function ReferralPage() {
  const [referralUrl, setReferralUrl] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReferral = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/referral");
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to load referral link");
        }
        setReferralUrl(json.referralUrl || "");
        setReferralCode(json.referralCode || "");
      } catch (e: any) {
        setError(e.message || "Failed to load referral link");
      } finally {
        setLoading(false);
      }
    };
    loadReferral();
  }, []);

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PageLayout showNavbar={false}>
      <div className="min-h-screen">
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
            <p className="text-gray-400 text-sm">
              Share your referral link with friends. When they sign up and invest, you can track their performance.
            </p>
          </div>

          <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your Referral Link</p>
                <p className="text-xs text-gray-500">
                  Friends can sign up through this link and be linked to your account.
                </p>
              </div>
              {referralCode && (
                <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                  Code: {referralCode}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-300">Loading your referral link...</span>
              </div>
            ) : error ? (
              <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/60 text-xs text-red-200">{error}</div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs sm:text-sm text-gray-100 font-mono truncate"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                  disabled={!referralUrl}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <BscPriceTicker />
    </PageLayout>
  );
}
