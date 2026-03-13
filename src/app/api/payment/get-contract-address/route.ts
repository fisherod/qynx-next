// =================================
// 📋 Get Contract Address API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { getChainConfig } from "@/lib/utils/chainUtils";
import { ChainType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { chain } = await request.json();

    if (!chain) {
      return NextResponse.json(
        { error: "Missing chain parameter" },
        { status: 400 }
      );
    }

    const chainType = chain as ChainType;
    const config = getChainConfig(chainType);
    
    // Get contract address (oneTimePing) and USDT address
    const contractAddress = config.oneTimePing;
    const usdtAddress = config.usdt;

    if (!contractAddress || !usdtAddress) {
      return NextResponse.json(
        { error: "Contract addresses not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contractAddress,
      usdtAddress,
    });
  } catch (error: any) {
    console.error("Error getting contract address:", error);
    return NextResponse.json(
      { error: "Failed to get contract address" },
      { status: 500 }
    );
  }
}

