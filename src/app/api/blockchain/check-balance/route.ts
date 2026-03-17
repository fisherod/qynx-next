// =================================
// 💰 Balance Check API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { ChainType, CurrencyType } from "@/types";
import { blockchainService } from "@/lib/blockchain";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chain = searchParams.get("chain");
    const currency = searchParams.get("currency");
    const amount = searchParams.get("amount");

    if (!address || !chain || !currency || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters: address, chain, currency, amount" },
        { status: 400 }
      );
    }

    const chainType = chain as ChainType;

    // Minimum native token required for gas (approximate)
    const MIN_NATIVE_TOKEN = chainType === "tron" ? "1" : "0.001"; // 1 TRX or 0.001 ETH/BNB

    const nativeBalance = await blockchainService.getNativeBalance(chainType, address);
    const tokenBalance = await blockchainService.getTokenBalance(chainType, currency as CurrencyType, address);

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
