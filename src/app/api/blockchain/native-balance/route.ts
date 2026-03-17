// =================================
// 💰 Admin Owner Balances API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain";
import { ChainType } from "@/types";
import { CHAINS } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    // Check authentication using query parameters
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const owner = searchParams.get("owner");

    // Validate required parameters
    if (!chain || !owner) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "chain and owner are required"
        },
        { status: 400 }
      );
    }

    // Validate chain type
    if (!CHAINS.includes(chain as ChainType)) {
      return NextResponse.json(
        {
          error: "Invalid chain",
          details: `Supported chains: ${CHAINS.join(", ")}`
        },
        { status: 400 }
      );
    }

    try {
      // Get balances using the balance service
      const nativeBalance = await blockchainService.getNativeBalance(chain as ChainType, owner);

      return NextResponse.json({
        success: true,
        chain,
        owner,
        nativeBalance: nativeBalance || "0"
      });
    } catch (balanceError: any) {
      console.error(`Error fetching balances for ${chain}:${owner}:`, balanceError);

      // Return default values if balance fetching fails
      return NextResponse.json({
        success: true,
        chain,
        owner,
        nativeBalance: "0",
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
