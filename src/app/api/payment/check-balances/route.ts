// =================================
// 💰 Balance Check API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { EVMService } from "@/lib/blockchain/evmService";
import { TronService } from "@/lib/blockchain/tronService";
import { ChainType } from "@/types";
import { getTokenDecimals } from "@/utils/chainUtils";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const { address, chain, currency, amount } = await request.json();

    if (!address || !chain || !currency || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const chainType = chain as ChainType;
    const decimals = getTokenDecimals(chainType, currency);
    
    // Minimum native token required for gas (approximate)
    const MIN_NATIVE_TOKEN = chainType === "tron" ? "1" : "0.001"; // 1 TRX or 0.001 ETH/BNB
    
    let nativeBalance = "0";
    let tokenBalance = "0";

    if (chainType === "tron") {
      // TRON balances
      const tronService = new TronService();
      nativeBalance = await tronService.getTrxBalance(address);
      tokenBalance = await TronService.getUserTokenBalance(chainType, currency, address);
      
      if (tokenBalance && tokenBalance !== "0") {
        tokenBalance = ethers.formatUnits(tokenBalance, decimals);
      } else {
        tokenBalance = "0";
      }
    } else {
      // EVM balances
      nativeBalance = await EVMService.getUserNativeBalance(chainType, address);
      const rawTokenBalance = await EVMService.getUserTokenBalance(chainType, currency, address);
      
      if (rawTokenBalance && rawTokenBalance !== "0") {
        tokenBalance = ethers.formatUnits(rawTokenBalance, decimals);
      } else {
        tokenBalance = "0";
      }
    }

    // Check if balances are sufficient
    const hasEnoughNative = parseFloat(nativeBalance) >= parseFloat(MIN_NATIVE_TOKEN);
    const hasEnoughToken = parseFloat(tokenBalance) >= parseFloat(amount);

    return NextResponse.json({
      hasEnoughNative,
      hasEnoughToken,
      nativeBalance,
      tokenBalance,
      requiredAmount: amount,
      minNativeToken: MIN_NATIVE_TOKEN,
    });
  } catch (error: any) {
    console.error("Error checking balances:", error);
    return NextResponse.json(
      {
        error: "Failed to check balances",
        hasEnoughNative: false,
        hasEnoughToken: false,
        nativeBalance: "0",
        tokenBalance: "0",
      },
      { status: 500 }
    );
  }
}

