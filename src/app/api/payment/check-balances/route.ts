// =================================
// 💰 Balance Check API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { ChainType } from "@/types";
import { blockchainService } from "@/lib/blockchain";

export async function POST(request: NextRequest) {
  try {
    const { address, chain, currency, amount } = await request.json();

    if (!address || !chain || !currency || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const chainType = chain as ChainType;

    // Minimum native token required for gas (approximate)
    const MIN_NATIVE_TOKEN = chainType === "tron" ? "1" : "0.001"; // 1 TRX or 0.001 ETH/BNB

    const nativeBalance = await blockchainService.getUserNativeBalance(chainType, address);
    const tokenBalance = await blockchainService.getUserTokenBalance(chainType, currency, address);

    // Check if balances are sufficient
    const hasEnoughNative = parseFloat(nativeBalance) >= parseFloat(MIN_NATIVE_TOKEN);
    const hasEnoughToken = parseFloat(tokenBalance) >= parseFloat(amount);

    return NextResponse.json({
      hasEnoughNative,
      hasEnoughToken,
      nativeBalance,
      tokenBalance,
      requiredAmount: amount,
      minNativeToken: MIN_NATIVE_TOKEN
    });
  } catch (error: any) {
    console.error("Error checking balances:", error);
    return NextResponse.json(
      {
        error: "Failed to check balances",
        hasEnoughNative: false,
        hasEnoughToken: false,
        nativeBalance: "0",
        tokenBalance: "0"
      },
      { status: 500 }
    );
  }
}
