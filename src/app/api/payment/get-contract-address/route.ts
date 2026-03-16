// =================================
// 📋 Get Contract Address API Route
// =================================

import { NextRequest, NextResponse } from "next/server";
import { GATEWAY_ADDRESSES, TOKEN_ADDRESSES } from "@/constants";
import { ChainType, CurrencyType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { chain, currency } = await request.json();

    if (!chain || !currency) {
      return NextResponse.json({ error: "Missing chain parameter" }, { status: 400 });
    }

    const chainType = chain as ChainType;

    // Get contract address and token address
    const contractAddress = GATEWAY_ADDRESSES[chainType];
    const tokenAddress = TOKEN_ADDRESSES[chainType][currency as CurrencyType];

    if (!contractAddress || !tokenAddress) {
      return NextResponse.json({ error: "Contract addresses not configured" }, { status: 500 });
    }

    return NextResponse.json({
      contractAddress,
      tokenAddress
    });
  } catch (error: any) {
    console.error("Error getting contract address:", error);
    return NextResponse.json({ error: "Failed to get contract address" }, { status: 500 });
  }
}
