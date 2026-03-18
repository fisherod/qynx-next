"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { formatAddress } from "@/utils/chainUtils";
import { getBitcoinAddressExplorerUrl } from "@/lib/bitcoin";

type TreasuryChain = "eth" | "bsc" | "tron" | "btc";

const TREASURY_CHAINS: Array<{ id: TreasuryChain; name: string; icon: string }> = [
  { id: "eth", name: "Ethereum", icon: "/chains/eth.svg" },
  { id: "bsc", name: "BSC", icon: "/chains/bsc.svg" },
  { id: "tron", name: "TRON", icon: "/chains/tron.svg" },
  { id: "btc", name: "Bitcoin", icon: "/chains/btc.svg" }
];

function getTreasuryChainLabel(chain: string): string {
  switch (chain) {
    case "eth":
      return "Ethereum";
    case "bsc":
      return "BSC";
    case "tron":
      return "TRON";
    case "btc":
      return "Bitcoin";
    default:
      return chain;
  }
}

function getTreasuryExplorerAddressUrl(chain: string, address: string): string {
  switch (chain) {
    case "eth":
      return `https://etherscan.io/address/${address}`;
    case "bsc":
      return `https://bscscan.com/address/${address}`;
    case "tron":
      return `https://tronscan.org/#/address/${address}`;
    case "btc":
      return getBitcoinAddressExplorerUrl(address);
    default:
      return "";
  }
}

function getBalanceIconPath(chain: string, symbol: string): string {
  if (symbol === "native") {
    switch (chain) {
      case "eth":
        return "/coins/eth.svg";
      case "bsc":
        return "/coins/bnb.svg";
      case "tron":
        return "/coins/trx.svg";
      case "btc":
        return "/coins/btc.svg";
      default:
        return "/coins/btc.svg";
    }
  }

  return `/coins/${symbol.toLowerCase()}.svg`;
}

function getBalanceLabel(chain: string, symbol: string): string {
  if (symbol === "native") {
    switch (chain) {
      case "eth":
        return "ETH";
      case "bsc":
        return "BNB";
      case "tron":
        return "TRX";
      case "btc":
        return "BTC";
      default:
        return "NATIVE";
    }
  }

  return symbol.toUpperCase();
}

interface TreasuryWallet {
  id: string;
  chain: string;
  address: string;
  name?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  balances?: { [key: string]: string };
}

export default function AdminTreasuryWalletsPage() {
  const { showToast } = useToast();
  const [wallets, setWallets] = useState<TreasuryWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [form, setForm] = useState({
    chain: "eth" as TreasuryChain,
    address: "",
    name: "",
    description: ""
  });

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/treasury-wallets", { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch treasury wallets");
      const data = await res.json();
      setWallets(data.data || []);
    } catch (e: any) {
      showToast(e.message || "Failed to load treasury wallets", "error");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = form.address.trim();
    if (!trimmed) {
      showToast("Address is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/treasury-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain: form.chain,
          address: trimmed,
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      showToast("Treasury wallet saved", "success");
      setForm({ chain: "eth", address: "", name: "", description: "" });
      setShowForm(false);
      await fetchWallets();
    } catch (e: any) {
      showToast(e.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this treasury wallet? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/treasury-wallets?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      showToast("Treasury wallet deleted", "success");
      await fetchWallets();
    } catch (e: any) {
      showToast(e.message || "Failed to delete", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (wallet: TreasuryWallet) => {
    setActivatingId(wallet.id);
    try {
      const res = await fetch("/api/admin/treasury-wallets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wallet.id,
          isActive: !wallet.is_active
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      showToast("Treasury wallet status updated", "success");
      await fetchWallets();
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
    } finally {
      setActivatingId(null);
    }
  };

  const chainDisplay = (chain: string) => getTreasuryChainLabel(chain);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            Treasury Wallet Management
          </h2>
          <p className="text-gray-400 text-sm ml-13">
            Manage treasury wallet addresses per chain for receiving payments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Treasury Wallet
        </button>
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add Treasury Wallet</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Chain</label>
                  <select
                    value={form.chain}
                    onChange={e => setForm(f => ({ ...f, chain: e.target.value as TreasuryChain }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {TREASURY_CHAINS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="0x... / T... / bc1..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Main Treasury"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setForm({ chain: "eth", address: "", name: "", description: "" });
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Chain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 py-8">
                      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <div className="text-sm font-medium text-gray-300">Loading treasury wallets...</div>
                    </div>
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-300">No treasury wallets</p>
                      <p className="text-sm text-gray-500">Add a wallet to start receiving payments per chain.</p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                      >
                        Add Treasury Wallet
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                wallets.map(w => (
                  <React.Fragment key={w.id}>
                    <tr
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedWalletId(current => (current === w.id ? null : w.id))}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              w.chain === "eth"
                                ? "bg-blue-500/10 border border-blue-500/20"
                                : w.chain === "bsc"
                                  ? "bg-yellow-500/10 border border-yellow-500/20"
                                  : w.chain === "tron"
                                    ? "bg-red-500/10 border border-red-500/20"
                                    : "bg-orange-500/10 border border-orange-500/20"
                            }`}
                          >
                            <img
                              src={
                                TREASURY_CHAINS.find(c => c.id === (w.chain as TreasuryChain))?.icon ||
                                "/chains/btc.svg"
                              }
                              alt={w.chain}
                              className="w-5 h-5"
                              onError={e => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white">{chainDisplay(w.chain)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{w.name || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-mono text-gray-300 truncate max-w-[180px]" title={w.address}>
                            {formatAddress(w.address)}
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(w.address);
                              showToast("Address copied", "success");
                            }}
                            className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white shrink-0"
                            title="Copy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <a
                            href={getTreasuryExplorerAddressUrl(w.chain, w.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-emerald-400 shrink-0"
                            title="View on explorer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                            w.is_active !== false
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {w.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleSetActive(w);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-60 ${
                              w.is_active !== false
                                ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5 cursor-default"
                                : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                            }`}
                          >
                            {w.is_active !== false
                              ? "Deactivate"
                              : activatingId === w.id
                                ? "Activating..."
                                : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(w.id);
                            }}
                            disabled={deletingId === w.id}
                            className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {deletingId === w.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedWalletId === w.id && (
                      <tr className="bg-gray-900/40">
                        <td colSpan={5} className="px-6 pb-4 pt-0">
                          <div className="mt-2 rounded-xl border border-gray-700/60 bg-gray-900/60 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                                {w.chain === "btc" ? "BTC Balance" : "Token Balances"}
                              </span>
                              {!w.balances && <span className="text-xs text-gray-500">No balance data</span>}
                            </div>
                            {w.balances ? (
                              w.chain === "btc" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/60 px-3 py-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase mb-1">
                                      <img
                                        src={getBalanceIconPath(w.chain, "native")}
                                        alt="BTC"
                                        className="w-4 h-4"
                                        onError={e => {
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                      <span>{getBalanceLabel(w.chain, "native")}</span>
                                    </div>
                                    <div className="text-sm font-mono text-emerald-300 truncate">
                                      {w.balances.native || "0"}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {Object.entries(w.balances).map(([symbol, amount]) => (
                                    <div
                                      key={symbol}
                                      className="rounded-lg border border-gray-700/50 bg-gray-800/60 px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase mb-1">
                                        <img
                                          src={getBalanceIconPath(w.chain, symbol)}
                                          alt={getBalanceLabel(w.chain, symbol)}
                                          className="w-4 h-4"
                                          onError={e => {
                                            e.currentTarget.style.display = "none";
                                          }}
                                        />
                                        <span>{getBalanceLabel(w.chain, symbol)}</span>
                                      </div>
                                      <div className="text-sm font-mono text-emerald-300 truncate">{amount}</div>
                                    </div>
                                  ))}
                                </div>
                              )
                            ) : (
                              <p className="text-xs text-gray-500">No balances available.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
