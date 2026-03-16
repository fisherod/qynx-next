// =================================
// 💰 Admin Owner Balances API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain";
import { ChainType, CurrencyType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Check authentication using query parameters
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const token = searchParams.get("token");
    const address = searchParams.get("address");

    // Validate required parameters
    if (!chain || !token || !address) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "chain and address are required"
        },
        { status: 400 }
      );
    }

    // Validate chain type
    const validChains = ["ethereum", "bsc", "tron"];
    if (!validChains.includes(chain)) {
      return NextResponse.json(
        {
          error: "Invalid chain",
          details: `Supported chains: ${validChains.join(", ")}`
        },
        { status: 400 }
      );
    }

    try {
      // Get balances using the balance service
      const nativeBalance = await blockchainService.getUserNativeBalance(chain as ChainType, address);
      const tokenBalance = await blockchainService.getUserTokenBalance(
        chain as ChainType,
        token as CurrencyType,
        address
      );

      return NextResponse.json({
        success: true,
        nativeBalance: nativeBalance || "0.000000",
        tokenBalance: tokenBalance || "0.00",
        chain,
        address
      });
    } catch (balanceError: any) {
      console.error(`Error fetching balances for ${chain}:${address}:`, balanceError);

      // Return default values if balance fetching fails
      return NextResponse.json({
        success: true,
        nativeBalance: "0.000000",
        tokenBalance: "0.00",
        chain,
        address,
        warning: "Failed to fetch real-time balances, using default values"
      });
    }
  } catch (error: any) {
    console.error("Owner balances API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch owner balances"
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
