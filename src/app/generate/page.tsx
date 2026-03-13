// =================================
// 🔗 支付链接生成页面
// =================================

"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    service_name: "",
    description: "",
    amount: "",
    language: "en",
    webhook_url: "",
  });
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
        service_name: formData.service_name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        language: formData.language,
        webhook_url: formData.webhook_url || undefined,
      };

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🔗</div>
              <div>
                <h1 className="text-xl font-bold text-white">Generate payment link</h1>
                <p className="text-sm text-gray-400">Create a USDT payment link</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Return to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Service/Product name *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="例如：VIP会员"
              value={formData.service_name}
              onChange={(e) =>
                setFormData({ ...formData, service_name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Product/Service Description (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="For example: VIP membership service"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-white font-medium mb-2">
              Payment Amount (USDT) *
            </label>
            <input
              type="number"
              required
              min="0.01"
              max="10000"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="For example: 100"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-white font-medium mb-2">
              Payment Page Language
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="fr">Français</option>
              <option value="tr">Türkçe</option>
              <option value="sk">Slovenčina</option>
              <option value="cs">Čeština</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-white font-medium mb-2">
              Callback URL (optional)
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              placeholder="https://your-site.com/webhook"
              value={formData.webhook_url}
              onChange={(e) =>
                setFormData({ ...formData, webhook_url: e.target.value })
              }
            />
            <p className="text-gray-400 text-sm mt-1">
              A notification will be sent to this address when the payment status changes.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            {loading ? "Generating..." : "Generate payment link"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="text-red-300">{error}</div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <div className="text-green-300">{success}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-white">Payment link generated</h3>

            {/* Payment URL */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <label className="block text-gray-300 text-sm mb-2">
                Payment link:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                  value={result.payment_url}
                />
                <button
                  onClick={() => handleCopy(result.payment_url)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Payment ID */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <label className="block text-gray-300 text-sm mb-2">
                Payment ID:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm font-mono"
                  value={result.payment_id}
                />
                <button
                  onClick={() => handleCopy(result.payment_id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* QR Code */}
            {result.qr_code && (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <label className="block text-gray-300 text-sm mb-2">
                  QR Code (scan with phone):
                </label>
                <div className="flex justify-center">
                  <img
                    src={result.qr_code}
                    alt="Payment QR Code"
                    className="w-48 h-48 border border-gray-600 rounded"
                  />
                </div>
              </div>
            )}

            {/* Test Link */}
            <div className="text-center">
              <Link
                href={result.payment_url}
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                <span className="mr-2">🔗</span>
                Test payment link
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
