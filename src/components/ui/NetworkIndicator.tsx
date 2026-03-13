// =================================
// 🌐 Network Mode Indicator
// =================================

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

interface NetworkInfo {
  mode: "mainnet" | "testnet";
  isMainnet: boolean;
  networks: Array<{
    chain: string;
    name: string;
    explorer: string;
  }>;
}

interface NetworkIndicatorProps {
  className?: string;
  variant?: "badge" | "full" | "minimal";
}

export function NetworkIndicator({
  className,
  variant = "badge",
}: NetworkIndicatorProps) {
  const { t } = useTranslation();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        const response = await fetch("/api/config", {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          // Handle nested network structure from API
          const network = data.network || data;
          setNetworkInfo({
            mode: network.mode || "testnet",
            isMainnet: network.isMainnet || false,
            networks: network.networks || [],
          });
        } else {
          // Fallback if API returns error
          setNetworkInfo({
            mode: "testnet",
            isMainnet: false,
            networks: [],
          });
        }
      } catch (error) {
        // Silent error handling for production - use fallback
        setNetworkInfo({
          mode: "testnet",
          isMainnet: false,
          networks: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkInfo();
  }, []);

  if (isLoading || !networkInfo || !networkInfo.mode) {
    return null;
  }

  const isMainnet = networkInfo.isMainnet;
  const mode = networkInfo.mode || "testnet";

  // Minimal variant - just a dot
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isMainnet ? "bg-green-500" : "bg-yellow-500",
          className
        )}
        title={t(`chains.${mode}`, { defaultValue: mode === "mainnet" ? "主网" : "测试网" })}
      />
    );
  }

  // Badge variant - small indicator
  if (variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          isMainnet
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
          className
        )}
      >
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1",
            isMainnet ? "bg-green-500" : "bg-yellow-500"
          )}
        />
        {t(`chains.${mode}`, { defaultValue: mode === "mainnet" ? "主网" : "测试网" })}
      </div>
    );
  }

  // Full variant - detailed information
  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        isMainnet
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
        className
      )}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isMainnet ? "bg-green-500" : "bg-yellow-500"
          )}
        />
        <h4
          className={cn(
            "font-semibold text-sm",
            isMainnet
              ? "text-green-800 dark:text-green-400"
              : "text-yellow-800 dark:text-yellow-400"
          )}
        >
          {t(`chains.${mode}`, { defaultValue: mode === "mainnet" ? "主网" : "测试网" })}
        </h4>
      </div>

      <div className="space-y-1">
        {networkInfo.networks.map((network) => (
          <div
            key={network.chain}
            className={cn(
              "text-xs",
              isMainnet
                ? "text-green-700 dark:text-green-300"
                : "text-yellow-700 dark:text-yellow-300"
            )}
          >
            <span className="font-medium capitalize">{network.chain}:</span>{" "}
            {network.name}
          </div>
        ))}
      </div>

      {!isMainnet && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
          ⚠️ This is a test environment. Use test tokens only.
        </div>
      )}
    </div>
  );
}
