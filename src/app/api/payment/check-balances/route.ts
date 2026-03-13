// =================================
// 💰 Balance Check API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { EVMService } from "@/lib/blockchain/evmService";
import { TronService } from "@/lib/blockchain/tronService";
import { ChainType } from "@/types";
import { getChainConfig } from "@/lib/utils/chainUtils";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const { address, chain, amount } = await request.json();

    if (!address || !chain || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const chainType = chain as ChainType;
    const config = getChainConfig(chainType);
    
    // Minimum native token required for gas (approximate)
    const MIN_NATIVE_TOKEN = chainType === "tron" ? "1" : "0.001"; // 1 TRX or 0.001 ETH/BNB
    
    let nativeBalance = "0";
    let usdtBalance = "0";

    if (chainType === "tron") {
      // TRON balances
      const tronService = new TronService();
      nativeBalance = await tronService.getTrxBalance(address);
      usdtBalance = await TronService.getUserUSDTBalance(chainType, address);
      
      // Convert USDT balance from raw to readable (6 decimals for TRON)
      if (usdtBalance && usdtBalance !== "0") {
        usdtBalance = (parseFloat(usdtBalance) / 1e6).toFixed(2);
      } else {
        usdtBalance = "0";
      }
    } else {
      // EVM balances
      nativeBalance = await EVMService.getUserNativeBalance(chainType, address);
      const rawUsdtBalance = await EVMService.getUserUSDTBalance(chainType, address);
      
      // Convert USDT balance from raw to readable
      const decimals = chainType === "ethereum" ? 6 : 18;
      if (rawUsdtBalance && rawUsdtBalance !== "0") {
        usdtBalance = ethers.formatUnits(rawUsdtBalance, decimals);
      } else {
        usdtBalance = "0";
      }
    }

    // Check if balances are sufficient
    const hasEnoughNative = parseFloat(nativeBalance) >= parseFloat(MIN_NATIVE_TOKEN);
    const hasEnoughUSDT = parseFloat(usdtBalance) >= parseFloat(amount);

    return NextResponse.json({
      hasEnoughNative,
      hasEnoughUSDT,
      nativeBalance,
      usdtBalance,
      requiredAmount: amount,
      minNativeToken: MIN_NATIVE_TOKEN,
    });
  } catch (error: any) {
    console.error("Error checking balances:", error);
    return NextResponse.json(
      {
        error: "Failed to check balances",
        hasEnoughNative: false,
        hasEnoughUSDT: false,
        nativeBalance: "0",
        usdtBalance: "0",
      },
      { status: 500 }
    );
  }
}

